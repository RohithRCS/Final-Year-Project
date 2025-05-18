const app = require('./app') 
const logger = require('./utils/logger')

app.listen(1234, () => {
  logger.info(`Server running on port 1234`)
})