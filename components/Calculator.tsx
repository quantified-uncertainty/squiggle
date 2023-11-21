import React from 'react';

const Calculator = () => {
  const [result, setResult] = React.useState(0);

  const calculate = (a: number, b: number) => {
    return a + b;
  };

  const handleClick = () => {
    const a = 5;
    const b = 10;
    const sum = calculate(a, b);
    setResult(sum);
  };

  return (
    <div>
      <h1>Calculator</h1>
      <button onClick={handleClick}>Calculate</button>
      <p>Result: {result}</p>
    </div>
  );
};

export default Calculator;
