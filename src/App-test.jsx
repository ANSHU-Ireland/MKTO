import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-bgPage text-fgBase flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-accent mb-4">
          MKTO Portfolio Optimization
        </h1>
        <p className="text-fgMuted text-lg">
          Loading application...
        </p>
        <div className="mt-8 p-6 bg-bgPanel rounded-lg shadow-lg">
          <p className="text-sm">
            ✅ React App is working!<br/>
            ✅ Tailwind CSS is loaded!<br/>
            ✅ Ready for optimization!
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
