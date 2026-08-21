// Calculator Plugin for Local AI Labs
// Advanced math operations and unit conversions

let api;

async function initialize(pluginAPI) {
  api = pluginAPI;
  api.log('Calculator plugin initialized');

  // Register tools
  api.registerTool('calculate', calculate);
  api.registerTool('convert', convert);
  api.registerTool('percentage', percentage);
  api.registerTool('compound', compoundInterest);

  // Register commands
  api.registerCommand('/calc', handleCalcCommand);
  api.registerCommand('/convert', handleConvertCommand);
}

// Simple expression evaluator without eval
function evaluateExpression(expr) {
  // Remove whitespace
  expr = expr.replace(/\s/g, '');

  // Handle parentheses first
  while (expr.includes('(')) {
    const lastOpen = expr.lastIndexOf('(');
    const firstClose = expr.indexOf(')', lastOpen);
    if (firstClose === -1) throw new Error('Mismatched parentheses');

    const inner = expr.substring(lastOpen + 1, firstClose);
    const result = evaluateExpression(inner);
    expr = expr.substring(0, lastOpen) + result + expr.substring(firstClose + 1);
  }

  // Handle multiplication and division
  let parts = expr.split(/([+\-])/);
  parts = parts.map(part => {
    if (part.includes('*') || part.includes('/')) {
      let nums = part.split(/([*/])/);
      let result = parseFloat(nums[0]);
      for (let i = 1; i < nums.length; i += 2) {
        const op = nums[i];
        const num = parseFloat(nums[i + 1]);
        if (op === '*') result *= num;
        else result /= num;
      }
      return result.toString();
    }
    return part;
  });

  // Handle addition and subtraction
  let result = parseFloat(parts[0]);
  for (let i = 1; i < parts.length; i += 2) {
    const op = parts[i];
    const num = parseFloat(parts[i + 1]);
    if (op === '+') result += num;
    else result -= num;
  }

  return result;
}

function calculate(params) {
  const { expression } = params;

  if (!expression) {
    throw new Error('Expression is required');
  }

  try {
    // Simple calculator - supports +, -, *, /
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = evaluateExpression(sanitized);

    return {
      expression,
      result,
      formatted: `${expression} = ${result}`
    };
  } catch (error) {
    throw new Error(`Invalid expression: ${error.message}`);
  }
}

function convert(params) {
  const { value, from, to } = params;

  if (!value || !from || !to) {
    throw new Error('value, from, and to are required');
  }

  const conversions = {
    // Length
    'm_to_ft': val => val * 3.28084,
    'ft_to_m': val => val / 3.28084,
    'km_to_mi': val => val * 0.621371,
    'mi_to_km': val => val / 0.621371,

    // Temperature
    'c_to_f': val => (val * 9/5) + 32,
    'f_to_c': val => (val - 32) * 5/9,
    'c_to_k': val => val + 273.15,
    'k_to_c': val => val - 273.15,

    // Weight
    'kg_to_lb': val => val * 2.20462,
    'lb_to_kg': val => val / 2.20462,
    'g_to_oz': val => val * 0.035274,
    'oz_to_g': val => val / 0.035274,

    // Volume
    'l_to_gal': val => val * 0.264172,
    'gal_to_l': val => val / 0.264172,
    'ml_to_oz': val => val * 0.033814,
    'oz_to_ml': val => val / 0.033814,

    // Time
    'h_to_min': val => val * 60,
    'min_to_h': val => val / 60,
    's_to_ms': val => val * 1000,
    'ms_to_s': val => val / 1000
  };

  const key = `${from}_to_${to}`;
  const converter = conversions[key];

  if (!converter) {
    throw new Error(`Conversion ${from} to ${to} not supported`);
  }

  const result = converter(parseFloat(value));

  return {
    value: parseFloat(value),
    from,
    to,
    result,
    formatted: `${value} ${from} = ${result.toFixed(2)} ${to}`
  };
}

function percentage(params) {
  const { value, percent, operation = 'of' } = params;

  const val = parseFloat(value);
  const pct = parseFloat(percent);

  let result;
  let description;

  switch (operation) {
    case 'of':
      result = (pct / 100) * val;
      description = `${pct}% of ${val}`;
      break;
    case 'increase':
      result = val + (pct / 100) * val;
      description = `${val} increased by ${pct}%`;
      break;
    case 'decrease':
      result = val - (pct / 100) * val;
      description = `${val} decreased by ${pct}%`;
      break;
    case 'change':
      result = ((pct - val) / val) * 100;
      description = `Change from ${val} to ${pct}`;
      break;
    default:
      throw new Error('Invalid operation');
  }

  return {
    value: val,
    percent: pct,
    operation,
    result,
    formatted: `${description} = ${result.toFixed(2)}`
  };
}

function compoundInterest(params) {
  const { principal, rate, time, frequency = 1 } = params;

  const p = parseFloat(principal);
  const r = parseFloat(rate) / 100;
  const t = parseFloat(time);
  const n = parseFloat(frequency);

  const amount = p * Math.pow((1 + r/n), n * t);
  const interest = amount - p;

  return {
    principal: p,
    rate: rate + '%',
    time: t + ' years',
    frequency: n + ' times/year',
    final_amount: amount.toFixed(2),
    interest_earned: interest.toFixed(2),
    formatted: `
Principal: $${p}
Rate: ${rate}% per year
Time: ${t} years
Compounding: ${n}x per year

Final Amount: $${amount.toFixed(2)}
Interest Earned: $${interest.toFixed(2)}
    `.trim()
  };
}

async function handleCalcCommand(args) {
  if (!args) {
    return {
      type: 'help',
      message: 'Usage: /calc <expression>\nExample: /calc 2 + 2 * 3'
    };
  }

  try {
    const result = calculate({ expression: args });
    return {
      type: 'calculation',
      data: result,
      formatted: result.formatted
    };
  } catch (error) {
    return {
      type: 'error',
      message: error.message
    };
  }
}

async function handleConvertCommand(args) {
  if (!args) {
    return {
      type: 'help',
      message: 'Usage: /convert <value> <from> <to>\nExample: /convert 100 km mi'
    };
  }

  const parts = args.trim().split(/\s+/);
  if (parts.length < 3) {
    return {
      type: 'error',
      message: 'Invalid format. Use: /convert <value> <from> <to>'
    };
  }

  try {
    const result = convert({
      value: parts[0],
      from: parts[1],
      to: parts[2]
    });
    return {
      type: 'conversion',
      data: result,
      formatted: result.formatted
    };
  } catch (error) {
    return {
      type: 'error',
      message: error.message
    };
  }
}

function cleanup() {
  api.log('Calculator plugin cleaned up');
}

module.exports = {
  initialize,
  cleanup
};
