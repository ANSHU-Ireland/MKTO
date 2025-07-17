"""
Knapsack Portfolio Optimization Service

This service implements a knapsack algorithm to optimize portfolio allocation.
The knapsack problem treats each asset as an item with:
- Weight: Risk (volatility, correlation, etc.)
- Value: Expected return or Sharpe ratio
- Capacity: Available capital or risk budget

The algorithm finds the optimal combination of assets that maximizes return
while staying within risk constraints.
"""

import numpy as np
import random
import math
from typing import List, Dict, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum
from loguru import logger
import time
from datetime import datetime

from app.core.redis_client import get_redis
from app.core.config import settings


class OptimizationMethod(Enum):
    """Available optimization methods."""
    DYNAMIC_PROGRAMMING = "dp"
    GENETIC_ALGORITHM = "ga"
    SIMULATED_ANNEALING = "sa"
    PARTICLE_SWARM = "pso"
    TABU_SEARCH = "tabu"
    HYBRID = "hybrid"


@dataclass
class MetaheuristicParams:
    """Parameters for metaheuristic algorithms."""
    population_size: int = 50
    generations: int = 100
    mutation_rate: float = 0.1
    crossover_rate: float = 0.8
    elite_size: int = 5
    
    # Simulated Annealing
    initial_temperature: float = 1000.0
    cooling_rate: float = 0.95
    min_temperature: float = 1.0
    
    # Particle Swarm
    inertia_weight: float = 0.5
    cognitive_weight: float = 1.5
    social_weight: float = 1.5
    
    # Tabu Search
    tabu_size: int = 20
    max_iterations: int = 1000


@dataclass
class AssetItem:
    """Represents an asset in the knapsack optimization."""
    symbol: str
    expected_return: float
    volatility: float
    sharpe_ratio: float
    weight: int  # Risk weight (scaled volatility)
    value: int   # Value score (scaled expected return or Sharpe)
    max_allocation: float  # Maximum position size (0.0 to 1.0)
    current_price: float


@dataclass
class OptimizationResult:
    """Result of portfolio optimization."""
    selected_assets: List[str]
    allocations: Dict[str, float]  # Asset -> allocation percentage
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    total_weight: int
    total_value: int
    optimization_time_ms: float
    method_used: str
    convergence_data: Optional[List[float]] = None  # For tracking optimization progress


@dataclass
class Individual:
    """Individual solution for genetic algorithm."""
    chromosome: List[int]  # Binary representation of selected assets
    fitness: float
    weight: int
    value: int
    valid: bool = True


@dataclass
class Particle:
    """Particle for particle swarm optimization."""
    position: List[float]  # Continuous position [0,1] for each asset
    velocity: List[float]
    best_position: List[float]
    best_fitness: float
    current_fitness: float


class KnapsackOptimizer:
    """
    Knapsack-based portfolio optimizer.
    
    Uses dynamic programming to solve the 0/1 knapsack problem for portfolio
    optimization, where we select assets to maximize risk-adjusted returns
    within a given risk budget.
    """
    
    def __init__(self, max_weight: int = 1000, risk_free_rate: float = 0.02, 
                 metaheuristic_params: Optional[MetaheuristicParams] = None):
        self.max_weight = max_weight  # Maximum risk budget
        self.risk_free_rate = risk_free_rate
        self.redis_client = None
        self.params = metaheuristic_params or MetaheuristicParams()
        
        # Set random seed for reproducible results
        random.seed(42)
        np.random.seed(42)
    
    async def init_redis(self):
        """Initialize Redis client for caching."""
        self.redis_client = await get_redis()
    
    def _calculate_metrics(self, returns: np.ndarray) -> Tuple[float, float, float]:
        """Calculate expected return, volatility, and Sharpe ratio."""
        expected_return = np.mean(returns)
        volatility = np.std(returns)
        sharpe_ratio = (expected_return - self.risk_free_rate) / volatility if volatility > 0 else 0
        return expected_return, volatility, sharpe_ratio
    
    def _scale_metrics(self, value: float, min_val: float, max_val: float, target_range: int = 100) -> int:
        """Scale metrics to integer range for knapsack algorithm."""
        if max_val == min_val:
            return target_range // 2
        scaled = int(((value - min_val) / (max_val - min_val)) * target_range)
        return max(1, min(target_range, scaled))
    
    def prepare_assets(self, asset_data: List[Dict]) -> List[AssetItem]:
        """
        Prepare asset data for knapsack optimization.
        
        Args:
            asset_data: List of dicts with keys: symbol, returns, current_price
        
        Returns:
            List of AssetItem objects ready for optimization
        """
        items = []
        
        # Calculate metrics for all assets
        metrics = []
        for asset in asset_data:
            returns = np.array(asset['returns'])
            if len(returns) < 2:
                continue
                
            expected_return, volatility, sharpe_ratio = self._calculate_metrics(returns)
            metrics.append({
                'symbol': asset['symbol'],
                'expected_return': expected_return,
                'volatility': volatility,
                'sharpe_ratio': sharpe_ratio,
                'current_price': asset['current_price']
            })
        
        if not metrics:
            return []
        
        # Extract values for scaling
        returns = [m['expected_return'] for m in metrics]
        volatilities = [m['volatility'] for m in metrics]
        sharpe_ratios = [m['sharpe_ratio'] for m in metrics]
        
        min_return, max_return = min(returns), max(returns)
        min_vol, max_vol = min(volatilities), max(volatilities)
        min_sharpe, max_sharpe = min(sharpe_ratios), max(sharpe_ratios)
        
        # Create AssetItem objects with scaled values
        for metric in metrics:
            # Use Sharpe ratio as primary value metric
            value = self._scale_metrics(metric['sharpe_ratio'], min_sharpe, max_sharpe, 100)
            
            # Use volatility as weight (higher volatility = higher weight = more risk)
            weight = self._scale_metrics(metric['volatility'], min_vol, max_vol, 50)
            
            # Default max allocation (can be customized per asset)
            max_allocation = 0.25  # 25% max per asset
            
            item = AssetItem(
                symbol=metric['symbol'],
                expected_return=metric['expected_return'],
                volatility=metric['volatility'],
                sharpe_ratio=metric['sharpe_ratio'],
                weight=weight,
                value=value,
                max_allocation=max_allocation,
                current_price=metric['current_price']
            )
            items.append(item)
        
        logger.info(f"Prepared {len(items)} assets for optimization")
        return items
    
    def solve_knapsack(self, items: List[AssetItem]) -> OptimizationResult:
        """
        Solve the knapsack problem using dynamic programming.
        
        Args:
            items: List of AssetItem objects
            
        Returns:
            OptimizationResult with optimal portfolio allocation
        """
        start_time = time.time()
        
        n = len(items)
        W = self.max_weight
        
        # DP table: dp[i][w] = maximum value using first i items with weight <= w
        dp = [[0 for _ in range(W + 1)] for _ in range(n + 1)]
        
        # Fill the DP table
        for i in range(1, n + 1):
            for w in range(1, W + 1):
                item = items[i - 1]
                
                # Don't include current item
                dp[i][w] = dp[i - 1][w]
                
                # Include current item if it fits
                if item.weight <= w:
                    include_value = dp[i - 1][w - item.weight] + item.value
                    dp[i][w] = max(dp[i][w], include_value)
        
        # Backtrack to find selected items
        selected_indices = []
        w = W
        for i in range(n, 0, -1):
            if dp[i][w] != dp[i - 1][w]:
                selected_indices.append(i - 1)
                w -= items[i - 1].weight
        
        selected_indices.reverse()
        
        # Calculate allocations using equal weighting initially
        # (Can be enhanced with more sophisticated allocation methods)
        selected_assets = [items[i].symbol for i in selected_indices]
        
        if not selected_assets:
            return OptimizationResult(
                selected_assets=[],
                allocations={},
                expected_return=0.0,
                expected_volatility=0.0,
                sharpe_ratio=0.0,
                total_weight=0,
                total_value=0,
                optimization_time_ms=(time.time() - start_time) * 1000
            )
        
        # Calculate optimal allocations based on Sharpe ratio and risk constraints
        allocations = self._optimize_allocations([items[i] for i in selected_indices])
        
        # Calculate portfolio metrics
        total_weight = sum(items[i].weight for i in selected_indices)
        total_value = sum(items[i].value for i in selected_indices)
        
        # Portfolio expected return and volatility (simplified calculation)
        portfolio_return = sum(
            allocations[items[i].symbol] * items[i].expected_return
            for i in selected_indices
        )
        
        # Simplified volatility calculation (assuming no correlation)
        portfolio_volatility = np.sqrt(sum(
            (allocations[items[i].symbol] ** 2) * (items[i].volatility ** 2)
            for i in selected_indices
        ))
        
        portfolio_sharpe = (
            (portfolio_return - self.risk_free_rate) / portfolio_volatility
            if portfolio_volatility > 0 else 0
        )
        
        optimization_time = (time.time() - start_time) * 1000
        
        result = OptimizationResult(
            selected_assets=selected_assets,
            allocations=allocations,
            expected_return=portfolio_return,
            expected_volatility=portfolio_volatility,
            sharpe_ratio=portfolio_sharpe,
            total_weight=total_weight,
            total_value=total_value,
            optimization_time_ms=optimization_time
        )
        
        logger.info(f"Optimization completed in {optimization_time:.2f}ms")
        logger.info(f"Selected {len(selected_assets)} assets: {selected_assets}")
        
        return result
    
    def _evaluate_solution(self, solution: List[int], items: List[AssetItem]) -> Tuple[int, int, bool]:
        """
        Evaluate a solution (binary array) and return value, weight, and validity.
        
        Args:
            solution: Binary array indicating selected items
            items: List of asset items
            
        Returns:
            Tuple of (total_value, total_weight, is_valid)
        """
        total_value = 0
        total_weight = 0
        
        for i, selected in enumerate(solution):
            if selected and i < len(items):
                total_value += items[i].value
                total_weight += items[i].weight
        
        is_valid = total_weight <= self.max_weight
        return total_value, total_weight, is_valid
    
    def _solution_to_result(self, solution: List[int], items: List[AssetItem], 
                           optimization_time: float, method: str, 
                           convergence_data: Optional[List[float]] = None) -> OptimizationResult:
        """Convert solution array to OptimizationResult."""
        selected_indices = [i for i, selected in enumerate(solution) if selected]
        selected_assets = [items[i].symbol for i in selected_indices]
        
        if not selected_assets:
            return OptimizationResult(
                selected_assets=[],
                allocations={},
                expected_return=0.0,
                expected_volatility=0.0,
                sharpe_ratio=0.0,
                total_weight=0,
                total_value=0,
                optimization_time_ms=optimization_time,
                method_used=method,
                convergence_data=convergence_data
            )
        
        # Calculate optimal allocations based on Sharpe ratio and risk constraints
        allocations = self._optimize_allocations([items[i] for i in selected_indices])
        
        # Calculate portfolio metrics
        total_value, total_weight, _ = self._evaluate_solution(solution, items)
        
        portfolio_return = sum(
            allocations[items[i].symbol] * items[i].expected_return
            for i in selected_indices
        )
        
        portfolio_volatility = np.sqrt(sum(
            (allocations[items[i].symbol] ** 2) * (items[i].volatility ** 2)
            for i in selected_indices
        ))
        
        portfolio_sharpe = (
            (portfolio_return - self.risk_free_rate) / portfolio_volatility
            if portfolio_volatility > 0 else 0
        )
        
        return OptimizationResult(
            selected_assets=selected_assets,
            allocations=allocations,
            expected_return=portfolio_return,
            expected_volatility=portfolio_volatility,
            sharpe_ratio=portfolio_sharpe,
            total_weight=total_weight,
            total_value=total_value,
            optimization_time_ms=optimization_time,
            method_used=method,
            convergence_data=convergence_data
        )
    
    def solve_genetic_algorithm(self, items: List[AssetItem]) -> OptimizationResult:
        """
        Solve using Genetic Algorithm.
        
        Args:
            items: List of AssetItem objects
            
        Returns:
            OptimizationResult with optimal portfolio allocation
        """
        start_time = time.time()
        n = len(items)
        convergence_data = []
        
        # Initialize population
        population = []
        for _ in range(self.params.population_size):
            chromosome = [random.randint(0, 1) for _ in range(n)]
            individual = Individual(chromosome=chromosome, fitness=0, weight=0, value=0)
            value, weight, valid = self._evaluate_solution(chromosome, items)
            individual.value = value
            individual.weight = weight
            individual.valid = valid
            individual.fitness = value if valid else 0  # Penalty for invalid solutions
            population.append(individual)
        
        best_fitness = 0
        best_solution = None
        
        for generation in range(self.params.generations):
            # Sort population by fitness
            population.sort(key=lambda x: x.fitness, reverse=True)
            
            # Track best fitness
            current_best = population[0].fitness
            convergence_data.append(current_best)
            
            if current_best > best_fitness:
                best_fitness = current_best
                best_solution = population[0].chromosome.copy()
            
            # Create new population
            new_population = []
            
            # Keep elite
            for i in range(self.params.elite_size):
                new_population.append(population[i])
            
            # Generate offspring
            while len(new_population) < self.params.population_size:
                # Selection (tournament selection)
                parent1 = self._tournament_selection(population)
                parent2 = self._tournament_selection(population)
                
                # Crossover
                if random.random() < self.params.crossover_rate:
                    child1, child2 = self._crossover(parent1, parent2)
                else:
                    child1, child2 = parent1, parent2
                
                # Mutation
                child1 = self._mutate(child1, items)
                child2 = self._mutate(child2, items)
                
                new_population.extend([child1, child2])
            
            population = new_population[:self.params.population_size]
        
        optimization_time = (time.time() - start_time) * 1000
        logger.info(f"Genetic Algorithm completed in {optimization_time:.2f}ms")
        
        return self._solution_to_result(
            best_solution or [0] * n, items, optimization_time, 
            "genetic_algorithm", convergence_data
        )
    
    def _tournament_selection(self, population: List[Individual], tournament_size: int = 3) -> Individual:
        """Tournament selection for genetic algorithm."""
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=lambda x: x.fitness)
    
    def _crossover(self, parent1: Individual, parent2: Individual) -> Tuple[Individual, Individual]:
        """Single-point crossover."""
        n = len(parent1.chromosome)
        point = random.randint(1, n - 1)
        
        child1_chromosome = parent1.chromosome[:point] + parent2.chromosome[point:]
        child2_chromosome = parent2.chromosome[:point] + parent1.chromosome[point:]
        
        child1 = Individual(chromosome=child1_chromosome, fitness=0, weight=0, value=0)
        child2 = Individual(chromosome=child2_chromosome, fitness=0, weight=0, value=0)
        
        return child1, child2
    
    def _mutate(self, individual: Individual, items: List[AssetItem]) -> Individual:
        """Mutation operator with repair mechanism."""
        mutated = individual.chromosome.copy()
        
        for i in range(len(mutated)):
            if random.random() < self.params.mutation_rate:
                mutated[i] = 1 - mutated[i]  # Flip bit
        
        # Repair if necessary (remove items until weight constraint is satisfied)
        while True:
            value, weight, valid = self._evaluate_solution(mutated, items)
            if valid:
                break
            
            # Find selected items and remove the one with worst value/weight ratio
            selected_indices = [i for i, selected in enumerate(mutated) if selected]
            if not selected_indices:
                break
                
            worst_ratio = float('inf')
            worst_idx = selected_indices[0]
            
            for idx in selected_indices:
                ratio = items[idx].value / items[idx].weight if items[idx].weight > 0 else 0
                if ratio < worst_ratio:
                    worst_ratio = ratio
                    worst_idx = idx
            
            mutated[worst_idx] = 0
        
        # Update individual
        value, weight, valid = self._evaluate_solution(mutated, items)
        individual.chromosome = mutated
        individual.value = value
        individual.weight = weight
        individual.valid = valid
        individual.fitness = value if valid else 0
        
        return individual
    
    def solve_simulated_annealing(self, items: List[AssetItem]) -> OptimizationResult:
        """
        Solve using Simulated Annealing.
        
        Args:
            items: List of AssetItem objects
            
        Returns:
            OptimizationResult with optimal portfolio allocation
        """
        start_time = time.time()
        n = len(items)
        convergence_data = []
        
        # Initialize with random solution
        current_solution = [random.randint(0, 1) for _ in range(n)]
        current_value, current_weight, current_valid = self._evaluate_solution(current_solution, items)
        
        # Repair initial solution if invalid
        if not current_valid:
            current_solution = self._repair_solution(current_solution, items)
            current_value, current_weight, current_valid = self._evaluate_solution(current_solution, items)
        
        best_solution = current_solution.copy()
        best_value = current_value
        
        temperature = self.params.initial_temperature
        
        while temperature > self.params.min_temperature:
            # Generate neighbor solution
            neighbor = self._generate_neighbor(current_solution, items)
            neighbor_value, neighbor_weight, neighbor_valid = self._evaluate_solution(neighbor, items)
            
            if not neighbor_valid:
                neighbor = self._repair_solution(neighbor, items)
                neighbor_value, neighbor_weight, neighbor_valid = self._evaluate_solution(neighbor, items)
            
            # Calculate acceptance probability
            delta = neighbor_value - current_value
            
            if delta > 0 or random.random() < math.exp(delta / temperature):
                current_solution = neighbor
                current_value = neighbor_value
                current_weight = neighbor_weight
                
                if current_value > best_value:
                    best_solution = current_solution.copy()
                    best_value = current_value
            
            convergence_data.append(best_value)
            temperature *= self.params.cooling_rate
        
        optimization_time = (time.time() - start_time) * 1000
        logger.info(f"Simulated Annealing completed in {optimization_time:.2f}ms")
        
        return self._solution_to_result(
            best_solution, items, optimization_time, 
            "simulated_annealing", convergence_data
        )
    
    def _optimize_allocations(self, selected_items: List[AssetItem]) -> Dict[str, float]:
        """
        Optimize allocation percentages for selected assets using risk-adjusted optimization.
        
        Args:
            selected_items: List of selected AssetItem objects
            
        Returns:
            Dictionary mapping asset symbols to allocation percentages
        """
        if not selected_items:
            return {}
        
        if len(selected_items) == 1:
            return {selected_items[0].symbol: 1.0}
        
        # Use inverse volatility weighting with Sharpe ratio adjustment
        # Higher Sharpe ratio = higher allocation, but constrained by max_allocation
        total_score = 0
        scores = {}
        
        for item in selected_items:
            # Combine Sharpe ratio with inverse volatility for scoring
            # Higher Sharpe = better, lower volatility = better
            sharpe_weight = max(0.1, item.sharpe_ratio + 1.0)  # Ensure positive
            volatility_weight = 1.0 / max(0.01, item.volatility)  # Inverse volatility
            
            # Combine both factors
            score = sharpe_weight * volatility_weight
            scores[item.symbol] = score
            total_score += score
        
        # Calculate initial allocations based on scores
        allocations = {}
        remaining_allocation = 1.0
        constrained_assets = []
        
        # First pass: allocate based on scores, respecting max_allocation
        for item in selected_items:
            if total_score > 0:
                target_allocation = scores[item.symbol] / total_score
                # Apply max allocation constraint
                actual_allocation = min(target_allocation, item.max_allocation)
                allocations[item.symbol] = actual_allocation
                remaining_allocation -= actual_allocation
                
                # Track if asset hit its constraint
                if actual_allocation >= item.max_allocation:
                    constrained_assets.append(item.symbol)
        
        # Second pass: redistribute remaining allocation among unconstrained assets
        if remaining_allocation > 0.001:  # Small threshold for floating point errors
            unconstrained_items = [item for item in selected_items 
                                 if item.symbol not in constrained_assets]
            
            if unconstrained_items:
                # Redistribute based on remaining capacity and scores
                unconstrained_total_score = sum(scores[item.symbol] for item in unconstrained_items)
                
                for item in unconstrained_items:
                    if unconstrained_total_score > 0:
                        additional_allocation = (remaining_allocation * 
                                               scores[item.symbol] / unconstrained_total_score)
                        
                        # Ensure we don't exceed max allocation
                        max_additional = item.max_allocation - allocations[item.symbol]
                        additional_allocation = min(additional_allocation, max_additional)
                        
                        allocations[item.symbol] += additional_allocation
        
        # Final normalization to ensure allocations sum to 1.0
        total_allocated = sum(allocations.values())
        if total_allocated > 0:
            for symbol in allocations:
                allocations[symbol] /= total_allocated
        
        return allocations

    def _generate_neighbor(self, solution: List[int], items: List[AssetItem]) -> List[int]:
        """Generate neighbor solution by flipping a random bit."""
        neighbor = solution.copy()
        idx = random.randint(0, len(neighbor) - 1)
        neighbor[idx] = 1 - neighbor[idx]
        return neighbor
    
    def _repair_solution(self, solution: List[int], items: List[AssetItem]) -> List[int]:
        """Repair invalid solution by removing items with worst value/weight ratio."""
        repaired = solution.copy()
        
        while True:
            value, weight, valid = self._evaluate_solution(repaired, items)
            if valid:
                break
            
            selected_indices = [i for i, selected in enumerate(repaired) if selected]
            if not selected_indices:
                break
            
            # Remove item with worst value/weight ratio
            worst_ratio = float('inf')
            worst_idx = selected_indices[0]
            
            for idx in selected_indices:
                ratio = items[idx].value / items[idx].weight if items[idx].weight > 0 else 0
                if ratio < worst_ratio:
                    worst_ratio = ratio
                    worst_idx = idx
            
            repaired[worst_idx] = 0
        
        return repaired
    
    def solve_particle_swarm(self, items: List[AssetItem]) -> OptimizationResult:
        """
        Solve using Particle Swarm Optimization.
        
        Args:
            items: List of AssetItem objects
            
        Returns:
            OptimizationResult with optimal portfolio allocation
        """
        start_time = time.time()
        n = len(items)
        convergence_data = []
        
        # Initialize swarm
        swarm = []
        global_best_position = None
        global_best_fitness = 0
        
        for _ in range(self.params.population_size):
            position = [random.random() for _ in range(n)]
            velocity = [random.uniform(-1, 1) for _ in range(n)]
            
            # Convert continuous position to binary and evaluate
            binary_solution = [1 if p > 0.5 else 0 for p in position]
            binary_solution = self._repair_solution(binary_solution, items)
            value, weight, valid = self._evaluate_solution(binary_solution, items)
            fitness = value if valid else 0
            
            particle = Particle(
                position=position,
                velocity=velocity,
                best_position=position.copy(),
                best_fitness=fitness,
                current_fitness=fitness
            )
            
            if fitness > global_best_fitness:
                global_best_fitness = fitness
                global_best_position = position.copy()
            
            swarm.append(particle)
        
        # PSO iterations
        for iteration in range(self.params.generations):
            for particle in swarm:
                # Update velocity
                for i in range(n):
                    r1, r2 = random.random(), random.random()
                    
                    cognitive = self.params.cognitive_weight * r1 * (particle.best_position[i] - particle.position[i])
                    social = self.params.social_weight * r2 * (global_best_position[i] - particle.position[i])
                    
                    particle.velocity[i] = (
                        self.params.inertia_weight * particle.velocity[i] + 
                        cognitive + social
                    )
                    
                    # Clamp velocity
                    particle.velocity[i] = max(-1, min(1, particle.velocity[i]))
                
                # Update position
                for i in range(n):
                    particle.position[i] += particle.velocity[i]
                    particle.position[i] = max(0, min(1, particle.position[i]))  # Clamp to [0,1]
                
                # Evaluate new position
                binary_solution = [1 if p > 0.5 else 0 for p in particle.position]
                binary_solution = self._repair_solution(binary_solution, items)
                value, weight, valid = self._evaluate_solution(binary_solution, items)
                fitness = value if valid else 0
                
                particle.current_fitness = fitness
                
                # Update personal best
                if fitness > particle.best_fitness:
                    particle.best_fitness = fitness
                    particle.best_position = particle.position.copy()
                
                # Update global best
                if fitness > global_best_fitness:
                    global_best_fitness = fitness
                    global_best_position = particle.position.copy()
            
            convergence_data.append(global_best_fitness)
        
        # Convert best position to binary solution
        best_binary = [1 if p > 0.5 else 0 for p in global_best_position]
        best_binary = self._repair_solution(best_binary, items)
        
        optimization_time = (time.time() - start_time) * 1000
        logger.info(f"Particle Swarm Optimization completed in {optimization_time:.2f}ms")
        
        return self._solution_to_result(
            best_binary, items, optimization_time, 
            "particle_swarm", convergence_data
        )
    
    def solve_tabu_search(self, items: List[AssetItem]) -> OptimizationResult:
        """
        Solve using Tabu Search.
        
        Args:
            items: List of AssetItem objects
            
        Returns:
            OptimizationResult with optimal portfolio allocation
        """
        start_time = time.time()
        n = len(items)
        convergence_data = []
        
        # Initialize
        current_solution = [random.randint(0, 1) for _ in range(n)]
        current_solution = self._repair_solution(current_solution, items)
        
        best_solution = current_solution.copy()
        current_value, _, _ = self._evaluate_solution(current_solution, items)
        best_value = current_value
        
        tabu_list = []
        
        for iteration in range(self.params.max_iterations):
            # Generate neighborhood (all single-bit flips)
            neighborhood = []
            for i in range(n):
                neighbor = current_solution.copy()
                neighbor[i] = 1 - neighbor[i]  # Flip bit
                neighbor = self._repair_solution(neighbor, items)
                neighborhood.append((neighbor, i))  # Store solution and move
            
            # Find best non-tabu move
            best_neighbor = None
            best_neighbor_value = float('-inf')
            best_move = None
            
            for neighbor, move in neighborhood:
                if move not in tabu_list:  # Not tabu
                    value, _, valid = self._evaluate_solution(neighbor, items)
                    if valid and value > best_neighbor_value:
                        best_neighbor_value = value
                        best_neighbor = neighbor
                        best_move = move
            
            # If no valid non-tabu move found, use best move (aspiration criteria)
            if best_neighbor is None:
                for neighbor, move in neighborhood:
                    value, _, valid = self._evaluate_solution(neighbor, items)
                    if valid and value > best_neighbor_value:
                        best_neighbor_value = value
                        best_neighbor = neighbor
                        best_move = move
            
            if best_neighbor is not None:
                current_solution = best_neighbor
                current_value = best_neighbor_value
                
                # Update tabu list
                tabu_list.append(best_move)
                if len(tabu_list) > self.params.tabu_size:
                    tabu_list.pop(0)
                
                # Update best solution
                if current_value > best_value:
                    best_value = current_value
                    best_solution = current_solution.copy()
            
            convergence_data.append(best_value)
        
        optimization_time = (time.time() - start_time) * 1000
        logger.info(f"Tabu Search completed in {optimization_time:.2f}ms")
        
        return self._solution_to_result(
            best_solution, items, optimization_time, 
            "tabu_search", convergence_data
        )
    
    def solve_hybrid(self, items: List[AssetItem]) -> OptimizationResult:
        """
        Solve using hybrid approach (combines multiple metaheuristics).
        
        Args:
            items: List of AssetItem objects
            
        Returns:
            OptimizationResult with optimal portfolio allocation
        """
        start_time = time.time()
        
        # Run multiple algorithms with reduced iterations
        original_generations = self.params.generations
        original_max_iterations = self.params.max_iterations
        
        # Reduce iterations for each algorithm in hybrid approach
        self.params.generations = max(20, original_generations // 3)
        self.params.max_iterations = max(100, original_max_iterations // 3)
        
        # Run algorithms
        ga_result = self.solve_genetic_algorithm(items)
        sa_result = self.solve_simulated_annealing(items)
        pso_result = self.solve_particle_swarm(items)
        
        # Restore original parameters
        self.params.generations = original_generations
        self.params.max_iterations = original_max_iterations
        
        # Select best result
        results = [ga_result, sa_result, pso_result]
        best_result = max(results, key=lambda x: x.total_value)
        
        # Combine convergence data
        combined_convergence = []
        if ga_result.convergence_data:
            combined_convergence.extend(ga_result.convergence_data)
        if sa_result.convergence_data:
            combined_convergence.extend(sa_result.convergence_data)
        if pso_result.convergence_data:
            combined_convergence.extend(pso_result.convergence_data)
        
        optimization_time = (time.time() - start_time) * 1000
        
        # Update result with hybrid information
        best_result.optimization_time_ms = optimization_time
        best_result.method_used = "hybrid"
        best_result.convergence_data = combined_convergence
        
        logger.info(f"Hybrid optimization completed in {optimization_time:.2f}ms")
        logger.info(f"Best method was: {max(results, key=lambda x: x.total_value).method_used}")
        
        return best_result
    
    async def optimize_portfolio(
        self, 
        asset_data: List[Dict],
        risk_budget: Optional[int] = None,
        method: OptimizationMethod = OptimizationMethod.DYNAMIC_PROGRAMMING
    ) -> OptimizationResult:
        """
        Main optimization function.
        
        Args:
            asset_data: List of asset data dictionaries
            risk_budget: Optional risk budget override
            method: Optimization method to use
            
        Returns:
            OptimizationResult with optimal portfolio
        """
        if risk_budget:
            self.max_weight = risk_budget
        
        # Prepare assets for optimization
        items = self.prepare_assets(asset_data)
        
        if not items:
            logger.warning("No valid assets for optimization")
            return OptimizationResult(
                selected_assets=[],
                allocations={},
                expected_return=0.0,
                expected_volatility=0.0,
                sharpe_ratio=0.0,
                total_weight=0,
                total_value=0,
                optimization_time_ms=0.0,
                method_used=method.value
            )
        
        # Choose optimization method
        if method == OptimizationMethod.DYNAMIC_PROGRAMMING:
            result = self.solve_knapsack(items)
            result.method_used = "dynamic_programming"
        elif method == OptimizationMethod.GENETIC_ALGORITHM:
            result = self.solve_genetic_algorithm(items)
        elif method == OptimizationMethod.SIMULATED_ANNEALING:
            result = self.solve_simulated_annealing(items)
        elif method == OptimizationMethod.PARTICLE_SWARM:
            result = self.solve_particle_swarm(items)
        elif method == OptimizationMethod.TABU_SEARCH:
            result = self.solve_tabu_search(items)
        elif method == OptimizationMethod.HYBRID:
            result = self.solve_hybrid(items)
        else:
            # Default to dynamic programming
            result = self.solve_knapsack(items)
            result.method_used = "dynamic_programming"
        
        # Publish optimization event
        if self.redis_client:
            await self.redis_client.publish_event("optimization_completed", {
                "timestamp": datetime.utcnow().isoformat(),
                "selected_assets": result.selected_assets,
                "optimization_time_ms": result.optimization_time_ms,
                "sharpe_ratio": result.sharpe_ratio,
                "method_used": result.method_used
            })
        
        return result
    
    async def _optimize_with_cache(self, items: List[AssetItem]) -> OptimizationResult:
        """Optimize with Redis caching."""
        # Create cache key based on items
        cache_key = self._create_cache_key(items)
        
        # Try to get from cache
        if self.redis_client:
            cached_result = await self.redis_client.get_cached_response(f"optimization:{cache_key}")
            if cached_result:
                logger.info("Using cached optimization result")
                # Parse and return cached result (implementation depends on serialization)
        
        # Perform optimization
        result = self.solve_knapsack(items)
        
        # Cache result
        if self.redis_client:
            # Serialize and cache result (implementation depends on serialization format)
            pass
        
        return result
    
    def _create_cache_key(self, items: List[AssetItem]) -> str:
        """Create a cache key based on asset items."""
        # Simple hash based on symbols and key metrics
        key_data = []
        for item in items:
            key_data.append(f"{item.symbol}:{item.value}:{item.weight}")
        return hash(":".join(sorted(key_data)))


# Global optimizer instance
knapsack_optimizer = KnapsackOptimizer()


async def get_optimizer() -> KnapsackOptimizer:
    """Dependency to get knapsack optimizer."""
    if not knapsack_optimizer.redis_client:
        await knapsack_optimizer.init_redis()
    return knapsack_optimizer
