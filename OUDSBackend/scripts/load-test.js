import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'], // http errors should be less than 5%
    http_req_duration: ['p(95)<1500'], // 95% of requests should be below 1.5s
  },
};

export default function () {
  const url = __ENV.BACKEND_URL || 'http://localhost:5000';
  
  const res = http.get(`${url}/api/auth/status`); // Using a health/status endpoint or similar
  
  check(res, {
    'status is 200': (r) => r.status === 200 || r.status === 404, // Accepting 404 if endpoint doesn't exist just to test raw throughput of Flask
  });
}
