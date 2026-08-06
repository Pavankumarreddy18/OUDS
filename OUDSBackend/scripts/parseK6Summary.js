const fs = require('fs');

function getMetricValue(metricObj, key) {
    if (!metricObj) return 'N/A';
    if (metricObj.values && metricObj.values[key] !== undefined) {
        return metricObj.values[key];
    }
    if (metricObj[key] !== undefined) {
        return metricObj[key];
    }
    return 'N/A';
}

function parseK6Summary(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`k6 summary file not found: ${filePath}`);
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const metrics = data.metrics;

        const totalReqs = getMetricValue(metrics.http_reqs, 'count');
        const rps = parseFloat(getMetricValue(metrics.http_reqs, 'rate')).toFixed(2);
        
        const reqDuration = metrics.http_req_duration || {};
        const avg = parseFloat(getMetricValue(reqDuration, 'avg')).toFixed(2);
        const min = parseFloat(getMetricValue(reqDuration, 'min')).toFixed(2);
        const max = parseFloat(getMetricValue(reqDuration, 'max')).toFixed(2);
        const p95 = parseFloat(getMetricValue(reqDuration, 'p(95)')).toFixed(2);
        
        const failRateRaw = getMetricValue(metrics.http_req_failed, 'rate');
        const failRate = failRateRaw !== 'N/A' ? (parseFloat(failRateRaw) * 100).toFixed(2) + '%' : '0.00%';
        
        const checksRaw = getMetricValue(metrics.checks, 'rate');
        const checks = checksRaw !== 'N/A' ? (parseFloat(checksRaw) * 100).toFixed(2) + '%' : 'N/A';

        const summary = `## 🚀 k6 API Load Testing Results

| Metric | Value |
|--------|-------|
| **Total Requests** | ${totalReqs} |
| **Throughput (RPS)** | ${rps} req/s |
| **Failure Rate** | ${failRate} |
| **Checks Passed** | ${checks} |
| **Average Latency** | ${avg} ms |
| **Min Latency** | ${min} ms |
| **Max Latency** | ${max} ms |
| **P95 Latency** | ${p95} ms |

> *Load test executed with 100 Virtual Users over 1 minute.*
`;

        if (process.env.GITHUB_STEP_SUMMARY) {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
            console.log("Written metrics to GITHUB_STEP_SUMMARY");
        } else {
            console.log("GITHUB_STEP_SUMMARY not set. Outputting to console:");
            console.log(summary);
        }

    } catch (e) {
        console.error("Error parsing k6 summary:", e);
    }
}

parseK6Summary('summary.json');
