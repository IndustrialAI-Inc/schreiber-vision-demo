const GradientSpinnerSVG = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg className="w-8 h-8 animate-spin" viewBox="0 0 50 50">
        <defs>
          <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D01E28EE" />
            <stop offset="100%" stopColor="#2573A3EE" />
          </linearGradient>
        </defs>
        <circle 
          cx="25" 
          cy="25" 
          r="20" 
          stroke="url(#spinnerGradient)" 
          fill="none" 
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0" 
        />
      </svg>
    </div>
  );
};

export default GradientSpinnerSVG;