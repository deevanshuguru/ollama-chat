// ============================================
// VISUAL DATA ANALYTICS ENGINE
// Auto-generate charts and graphs from data
// ============================================

const { VM } = require('vm2');

class DataVisualizer {
  constructor() {
    this.supportedTypes = ['bar', 'line', 'pie', 'scatter', 'doughnut', 'radar'];
    this.chartColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
  }

  // Auto-detect best chart type for data
  detectChartType(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return 'bar'; // default
    }

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // If only 2 columns and one is a label
    if (keys.length === 2) {
      const hasLabel = keys.some(k =>
        typeof firstRow[k] === 'string' ||
        k.toLowerCase().includes('label') ||
        k.toLowerCase().includes('name') ||
        k.toLowerCase().includes('category')
      );

      if (hasLabel) {
        // Small dataset = pie, larger = bar
        return data.length <= 7 ? 'pie' : 'bar';
      }
    }

    // Time series data
    const hasTime = keys.some(k =>
      k.toLowerCase().includes('time') ||
      k.toLowerCase().includes('date') ||
      k.toLowerCase().includes('month') ||
      k.toLowerCase().includes('year')
    );

    if (hasTime) {
      return 'line';
    }

    // Two numeric columns = scatter
    const numericCount = keys.filter(k => typeof firstRow[k] === 'number').length;
    if (numericCount >= 2 && data.length > 5) {
      return 'scatter';
    }

    // Default to bar chart
    return 'bar';
  }

  // Parse CSV string into array of objects
  parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};

      headers.forEach((header, idx) => {
        const value = values[idx];
        // Try to parse as number
        const num = parseFloat(value);
        row[header] = isNaN(num) ? value : num;
      });

      data.push(row);
    }

    return data;
  }

  // Parse JSON data
  parseJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects');
      }
      return data;
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  // Generate Chart.js configuration
  generateChartConfig(data, type, options = {}) {
    const chartType = type || this.detectChartType(data);
    const keys = Object.keys(data[0]);

    // Find label column and value columns
    const labelKey = keys.find(k =>
      typeof data[0][k] === 'string' ||
      k.toLowerCase().includes('label') ||
      k.toLowerCase().includes('name')
    ) || keys[0];

    const valueKeys = keys.filter(k => k !== labelKey);

    const labels = data.map(row => row[labelKey]);

    let datasets;

    if (chartType === 'pie' || chartType === 'doughnut') {
      // Pie charts: single dataset with multiple colors
      datasets = [{
        label: options.label || 'Data',
        data: data.map(row => row[valueKeys[0]]),
        backgroundColor: this.chartColors.slice(0, data.length),
        borderColor: '#fff',
        borderWidth: 2
      }];
    } else if (chartType === 'scatter') {
      // Scatter: x and y coordinates
      datasets = [{
        label: options.label || 'Data Points',
        data: data.map(row => ({
          x: row[valueKeys[0]],
          y: row[valueKeys[1]]
        })),
        backgroundColor: this.chartColors[0],
        borderColor: this.chartColors[0]
      }];
    } else {
      // Bar, line, radar: one dataset per value column
      datasets = valueKeys.map((key, idx) => ({
        label: key,
        data: data.map(row => row[key]),
        backgroundColor: this.chartColors[idx % this.chartColors.length] + '80',
        borderColor: this.chartColors[idx % this.chartColors.length],
        borderWidth: 2,
        tension: chartType === 'line' ? 0.4 : 0
      }));
    }

    return {
      type: chartType,
      data: {
        labels: chartType === 'scatter' ? undefined : labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title || '',
            font: { size: 18 }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: chartType === 'pie' || chartType === 'doughnut' ? undefined : {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    };
  }

  // Generate complete HTML visualization
  generateHTML(chartConfig, options = {}) {
    const width = options.width || 800;
    const height = options.height || 500;
    const title = options.title || 'Data Visualization';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: ${width}px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
      font-size: 24px;
    }
    .chart-container {
      position: relative;
      height: ${height}px;
      width: 100%;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    @media (max-width: 768px) {
      .container {
        padding: 15px;
      }
      h1 {
        font-size: 18px;
      }
      .chart-container {
        height: 300px;
      }
      .stats {
        flex-direction: column;
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
    <div class="stats" id="stats"></div>
    <div class="footer">
      🚀 Generated by Local AI Labs | Powered by Chart.js
    </div>
  </div>

  <script>
    const config = ${JSON.stringify(chartConfig)};
    const ctx = document.getElementById('chart');
    const chart = new Chart(ctx, config);

    // Calculate statistics
    const data = config.data.datasets[0].data;
    const numericData = Array.isArray(data)
      ? data.filter(v => typeof v === 'number')
      : data.map(d => d.y || d.x).filter(v => typeof v === 'number');

    if (numericData.length > 0) {
      const sum = numericData.reduce((a, b) => a + b, 0);
      const avg = sum / numericData.length;
      const max = Math.max(...numericData);
      const min = Math.min(...numericData);

      document.getElementById('stats').innerHTML = \`
        <div class="stat">
          <div class="stat-value">\${numericData.length}</div>
          <div class="stat-label">Data Points</div>
        </div>
        <div class="stat">
          <div class="stat-value">\${avg.toFixed(2)}</div>
          <div class="stat-label">Average</div>
        </div>
        <div class="stat">
          <div class="stat-value">\${max}</div>
          <div class="stat-label">Maximum</div>
        </div>
        <div class="stat">
          <div class="stat-value">\${min}</div>
          <div class="stat-label">Minimum</div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
  }

  // Main visualization method
  async visualize(input, options = {}) {
    try {
      let data;

      // Parse input data
      if (typeof input === 'string') {
        // Check if CSV or JSON
        const trimmed = input.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          data = this.parseJSON(trimmed);
        } else {
          data = this.parseCSV(trimmed);
        }
      } else if (Array.isArray(input)) {
        data = input;
      } else {
        throw new Error('Input must be CSV string, JSON string, or array of objects');
      }

      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data to visualize');
      }

      // Generate chart config
      const chartType = options.type || this.detectChartType(data);
      const chartConfig = this.generateChartConfig(data, chartType, options);

      // Generate HTML
      const html = this.generateHTML(chartConfig, options);

      return {
        success: true,
        chartType,
        dataPoints: data.length,
        html,
        config: chartConfig
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Quick statistics calculation
  calculateStats(data) {
    const keys = Object.keys(data[0]);
    const stats = {};

    keys.forEach(key => {
      const values = data.map(row => row[key]).filter(v => typeof v === 'number');

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[key] = {
          count: values.length,
          sum,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          median: this.calculateMedian(values)
        };
      }
    });

    return stats;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

module.exports = DataVisualizer;
