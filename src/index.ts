import metricsClient from 'prom-client'

const register = new metricsClient.Registry()
metricsClient.collectDefaultMetrics({ register })

const counters: Record<string, metricsClient.Counter> = {}
const gauges: Record<string, metricsClient.Gauge> = {}

/**
 * Increases a counter metric by a specified increment. If the counter does not exist, it will be created with the provided <b>name</b>, <b>description</b>, and optional <i>labels</i>.<br />
 * If labels are provided, they must be in pairs of label name and label value.<br /><br />
 *
 * Example usage:
 * ```typescript
 * countInc('http_requests_total', 'Total number of HTTP requests', 5, ['method', 'GET'], ['status', '200'])
 * countInc('errors_total', 'Total number of errors', 1)
 * ```
 *
 * @param name - The name of the counter metric
 * @param description - A brief description of the counter metric
 * @param increment - The amount to increase the counter by
 * @param labels - Optional pairs of label names and label values
 */
export function countInc(name: string, description: string, increment: number, ...labels: [labelName: string, labelValue: string][]): void {
  const counter = counters[name] ?? createCounter(name, description, ...labels)

  if (labels.length > 0) {
    counter.labels(generateLabelValues(...labels)).inc(increment)
    return
  }

  counter.inc(increment)
}

/**
 * Increases a counter metric by 1. If the counter does not exist, it will be created with the provided <b>name</b>, <b>description</b>, and optional <i>labels</i>.<br />
 * If labels are provided, they must be in pairs of label name and label value.<br /><br />
 *
 * Example usage:
 * ```typescript
 * count('http_requests_total', 'Total number of HTTP requests', ['method', 'GET'], ['status', '200'])
 * count('errors_total', 'Total number of errors')
 * ```
 *
 * @param name - The name of the counter metric
 * @param description - A brief description of the counter metric
 * @param labels - Optional pairs of label names and label values
 */
export function count(name: string, description: string, ...labels: [labelName: string, labelValue: string][]): void {
  countInc(name, description, 1, ...labels)
}

/**
 * Sets a gauge metric to a specified value. If the gauge does not exist, it will be created with the provided <b>name</b>, <b>description</b>, and optional <i>labels</i>.<br />
 * If labels are provided, they must be in pairs of label name and label value.<br /><br />
 *
 * Example usage:
 * ```typescript
 * gauge('memory_usage_bytes', 'Memory usage in bytes', 512000, ['service', 'auth'])
 * gauge('active_sessions', 'Number of active sessions', 120)
 * ```
 *
 * @param name - The name of the gauge metric
 * @param description - A brief description of the gauge metric
 * @param value - The value to set the gauge to
 * @param labels - Optional pairs of label names and label values
 */
export function gauge(name: string, description: string, value: number, ...labels: [labelName: string, labelValue: string][]): void {
  const gauge = gauges[name] ?? createGauge(name, description, ...labels)

  if (labels.length > 0) {
    gauge.labels(generateLabelValues(...labels)).set(value)
    return
  }

  gauge.set(value)
}

const createCounter = (name: string, description: string, ...labels: [labelName: string, labelValue: string][]): metricsClient.Counter => {
  if (labels.some(labelPair => !Array.isArray(labelPair) || labelPair.length !== 2)) {
    throw new Error(`Can not create counter metric '${name}' with description '${description}' because labels must be provided in pairs of label name and label value!`)
  }

  const counter = new metricsClient.Counter<string>({
    name,
    help: description,
    labelNames: labels.map(([labelName]) => labelName)
  })

  counters[name] = counter
  register.registerMetric(counter)

  return counter
}

const createGauge = (name: string, description: string, ...labels: [labelName: string, labelValue: string][]): metricsClient.Gauge => {
  if (labels.some(labelPair => !Array.isArray(labelPair) || labelPair.length !== 2)) {
    throw new Error(`Can not create gauge metric '${name}' with description '${description}' because labels must be provided in pairs of label name and label value!`)
  }

  const gauge = new metricsClient.Gauge<string>({
    name,
    help: description,
    labelNames: labels.map(([labelName]) => labelName)
  })

  gauges[name] = gauge
  register.registerMetric(gauge)

  return gauge
}

const generateLabelValues = (...labels: [labelName: string, labelValue: string][]): { [key: string]: string } => {
  const labelValues: { [key: string]: string } = {}

  labels.forEach(([labelName, labelValue]): void => {
    labelValues[labelName] = labelValue
  })

  return labelValues
}

export { register }