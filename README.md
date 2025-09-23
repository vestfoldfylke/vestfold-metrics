# vestfold-metrics

This repository is a wrapper on the [prom-client](https://github.com/siimon/prom-client) library to provide easier interaction with Prometheus metrics in a Node.js application.

## Installation

```bash
npm install vestfold-metrics
```

## Usage

All metrics can take optional labels as an array of string in the format `...[name, value]`

If a metric is created with a set of labels, all future interactions with that metric must use the same set of labels.

### Counter metric

See the prom-client [documentation](https://github.com/siimon/prom-client?tab=readme-ov-file#counter) for counter details.

```typescript
import { count, countInc } from 'vestfold-metrics'

// Create and increment a counter without labels - Will result in a counter named 'my_counter' with the value of 1
count('my_counter', 'This is my counter')

// Increment the same counter again - Will reuse the counter named 'my_counter' and the value is now 2
count('my_counter', 'This is my counter')

// Create and increment a counter with labels - Will result in a counter named 'my_counter_label' with the value of 1 and label 'result' with value 'success'
count('my_counter_label', 'This is my counter with label', ['result', 'success'])

// Increment the same counter again - Will reuse the counter named 'my_counter_label' and the value is now 2 and label 'result' with value 'success'
count('my_counter_label', 'This is my counter with label', ['result', 'success'])



// Create and increment a counter with specific increment value without labels - Will result in a counter named 'my_counter_inc' with the value of 19
countInc('my_counter_inc', 'This is my counter', 19)

// Increment the same counter again with specific increment value - Will reuse the counter named 'my_counter_inc' and the value is now 40
countInc('my_counter_inc', 'This is my counter', 21)

// Create and increment a counter with specific increment value with labels - Will result in a counter named 'my_counter_inc_label' with the value of 19 and label 'result' with value 'success'
countInc('my_counter_inc_label', 'This is my counter with label', 19, ['result', 'success'])

// Increment the same counter again with specific increment value - Will reuse the counter named 'my_counter_inc_label' and the value is now 40 and label 'result' with value 'success'
countInc('my_counter_inc_label', 'This is my counter with label', 21, ['result', 'success'])
```

### Gauge metric

See the prom-client [documentation](https://github.com/siimon/prom-client?tab=readme-ov-file#gauge) for gauge details.

```typescript
import { gauge } from 'vestfold-metrics'

// Create and set a gauge without labels - Will result in a gauge named 'my_gauge' with the value of 10
gauge('my_gauge', 'This is my gauge', 10)

// Set the same gauge again - Will reuse the gauge named 'my_gauge' and the value is now 5
gauge('my_gauge', 'This is my gauge', 5)

// Create and set a gauge with labels - Will result in a gauge named 'my_gauge_label' with the value of 15 and label 'result' with value 'success'
gauge('my_gauge_label', 'This is my gauge with label', 15, ['result', 'success'])

// Set the same gauge again - Will reuse the gauge named 'my_gauge_label' and the value is now 8 and label 'result' with value 'success'
gauge('my_gauge_label', 'This is my gauge with label', 8 ['result', 'success'])
```

### Metrics endpoint

Expose your metrics to Prometheus by creating an HTTP endpoint in your Node.js application. This endpoint should return the metrics in the Prometheus exposition format.

#### Example for Azure Functions:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { register } from 'vestfold-metrics'

export async function metrics(_: HttpRequest, __: InvocationContext): Promise<HttpResponseInit> {
  return {
    status: 200,
    headers: { 'Content-Type': register.contentType },
    body: await register.metrics()
  }
}

app.get('metrics', {
  authLevel: 'function',
  handler: metrics
})
```

#### Example for Express

```typescript
import express from 'express'
import { register } from 'vestfold-metrics'

const app = express()

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.listen(3000, () => {
  console.log('Server listening on port 3000')
})
```