import metricsClient, { type LabelValues } from "prom-client";

export type MetricLabel = [labelName: string, labelValue: string];

type MetricType = "Counter" | "Gauge";

const register = new metricsClient.Registry();
metricsClient.collectDefaultMetrics({ register });

const counters: Record<string, metricsClient.Counter> = {};
const gauges: Record<string, metricsClient.Gauge> = {};

/**
 * Increases a counter metric by a specified increment. If the counter does not exist, it will be created with the provided <b>name</b>, <b>description</b>, and optional <i>labels</i>.<br />
 * If labels are provided, they must be in pairs of label name and label value.<br /><br />
 *
 * Example usage:
 * ```TypeScript
 * countInc("http_requests_total", "Total number of HTTP requests", 5, ["method", "GET"], ["status", "200"])
 * countInc("errors_total", "Total number of errors", 1)
 * ```
 *
 * @param name - The name of the counter metric
 * @param description - A brief description of the counter metric
 * @param increment - The amount to increase the counter by
 * @param labels - Optional pairs of label names and label values
 */
export const countInc = (name: string, description: string, increment: number, ...labels: MetricLabel[]): void => {
  const counter = counters[name] ?? createCounter(name, description, ...labels);

  if (labels.length > 0) {
    counter.labels(generateLabelValues(...labels)).inc(increment);
    return;
  }

  counter.inc(increment);
};

/**
 * Increases a counter metric by 1. If the counter does not exist, it will be created with the provided <b>name</b>, <b>description</b>, and optional <i>labels</i>.<br />
 * If labels are provided, they must be in pairs of label name and label value.<br /><br />
 *
 * Example usage:
 * ```TypeScript
 * count("http_requests_total", "Total number of HTTP requests", ["method", "GET"], ["status", "200"])
 * count("errors_total", "Total number of errors")
 * ```
 *
 * @param name - The name of the counter metric
 * @param description - A brief description of the counter metric
 * @param labels - Optional pairs of label names and label values
 */
export const count = (name: string, description: string, ...labels: MetricLabel[]): void => {
  countInc(name, description, 1, ...labels);
};

/**
 * Sets a gauge metric to a specified value. If the gauge does not exist, it will be created with the provided <b>name</b>, <b>description</b>, and optional <i>labels</i>.<br />
 * If labels are provided, they must be in pairs of label name and label value.<br /><br />
 *
 * Example usage:
 * ```TypeScript
 * gauge("memory_usage_bytes", "Memory usage in bytes", 512000, ["service", "auth"])
 * gauge("active_sessions", "Number of active sessions", 120)
 * ```
 *
 * @param name - The name of the gauge metric
 * @param description - A brief description of the gauge metric
 * @param value - The value to set the gauge to
 * @param labels - Optional pairs of label names and label values
 */
export const gauge = (name: string, description: string, value: number, ...labels: MetricLabel[]): void => {
  const gauge = gauges[name] ?? createGauge(name, description, ...labels);

  if (labels.length > 0) {
    gauge.labels(generateLabelValues(...labels)).set(value);
    return;
  }

  gauge.set(value);
};

export function removeCounter(name: string, ...labels: MetricLabel[]): void {
  removeMetric("Counter", name, ...labels);
}

export function removeGauge(name: string, ...labels: MetricLabel[]): void {
  removeMetric("Gauge", name, ...labels);
}

const createCounter = (name: string, description: string, ...labels: MetricLabel[]): metricsClient.Counter => {
  if (labels.some((labelPair: MetricLabel) => !Array.isArray(labelPair) || labelPair.length !== 2)) {
    throw new Error(
      `Can not create counter metric "${name}" with description "${description}" because labels must be provided in pairs of label name and label value!`
    );
  }

  const counter = new metricsClient.Counter<string>({
    name,
    help: description,
    labelNames: labels.map(([labelName]) => labelName)
  });

  counters[name] = counter;
  register.registerMetric(counter);

  return counter;
};

const createGauge = (name: string, description: string, ...labels: MetricLabel[]): metricsClient.Gauge => {
  if (labels.some((labelPair: MetricLabel) => !Array.isArray(labelPair) || labelPair.length !== 2)) {
    throw new Error(
      `Can not create gauge metric "${name}" with description "${description}" because labels must be provided in pairs of label name and label value!`
    );
  }

  const gauge = new metricsClient.Gauge<string>({
    name,
    help: description,
    labelNames: labels.map(([labelName]) => labelName)
  });

  gauges[name] = gauge;
  register.registerMetric(gauge);

  return gauge;
};

const generateLabelValues = (...labels: MetricLabel[]): LabelValues<string> => {
  const labelValues: LabelValues<string> = {};

  labels.forEach(([labelName, labelValue]): void => {
    labelValues[labelName] = labelValue;
  });

  return labelValues;
};

const removeMetric = (type: MetricType, name: string, ...labels: MetricLabel[]): void => {
  let metric: metricsClient.Metric | undefined;

  switch (type) {
    case "Counter":
      metric = counters[name];
      break;
    case "Gauge":
      metric = gauges[name];
      break;
    default:
      throw new Error(`Metric type ${type} is not supported`);
  }

  if (!metric) {
    throw new Error(`Metric with type ${type} was not found`);
  }

  if (labels.length > 0) {
    metric.remove(generateLabelValues(...labels));
    return;
  }

  metric.remove();
  return;
};

export { register };
