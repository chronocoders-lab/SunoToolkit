// scripts/monitor.js
const fs = require('fs')
const path = require('path')

function trackPerformance () {
  const logFile = path.join(__dirname, '../data/output/logs/performance.log')

  setInterval(() => {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const stats = {
      timestamp: new Date().toISOString(),
      memory: memUsage,
      cpu: cpuUsage,
      uptime: process.uptime()
    }

    fs.appendFileSync(logFile, JSON.stringify(stats) + '\n')
  }, 60000) // Her dakika
}
