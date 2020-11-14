const fetch = require('node-fetch')

/**
 * Reads the entire response body and process based in the Content-Type header
 * https://developer.mozilla.org/en-US/docs/Web/API/Body
 *
 * @param {object}  response    A response from a fetch request
 * @param {boolean} arrayBuffer When body can't be processed to `text`,
 * `json`, or `form-data`, process it to an ArrayBuffer or a Blob (default)
 *
 * @return {Promise} A promise that resolves after the entire body is processed
 */
function processBody(response, arrayBuffer = false) {
  const mime = (response.headers.get('Content-Type') || '').split(',')[0]
  if (mime.includes('text')) return response.text()
  else if (mime.includes('json')) return response.json()
  else if (mime.includes('form-data')) return response.formData()
  else return (arrayBuffer) ? response.arrayBuffer() : response.blob()
}

/**
 * Requests a resource using fetch, and process the response body by default
 *
 * @param {string}  resource     URL of a network resource
 * @param {object}  options      Fetch request options object
 * @param {boolean} readBody     Read and process the entire response body
 * @param {boolean} arrayBuffer  When body can't be processed to `text`,
 * `json`, or `form-data`, process it to an ArrayBuffer or a Blob (default)
 *
 * @return {Promise} A promise that resolves when the request is succesful
 * (HTTP status code between 200 and 299) and rejects otherwise.
 * Errors are similar to the Axios library, with `error.response` (HTTP errors)
 * and `error.message` (failed to fetch / cancelled requests)
 */
function request(resource, options, readBody = true, arrayBuffer = false) {
  return new Promise((resolve, reject) => {
    const config = { resource, ...options }
    fetch(resource, options)
      // Reject if not ok, so that listeners may catch HTTP status > 299
      .then((response) => {
        const message = 'Request failed'
        const res = { response, config }
        // If requested, read and process the entire response body
        if (readBody) processBody(response, arrayBuffer).then((data) => {
          return (response.ok)
            ? resolve({ ...res, data })
            : reject({ ...res, data, message })
        })
        else (response.ok) ? resolve(res) : reject({ ...res, message })
      })
      // Network/Cancel errors, similar to the error handling in Axios
      .catch((error) => reject({ message: error.message, config }))
  })
}

module.exports = request
