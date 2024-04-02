import posthog from 'posthog-js'

posthog.init('phc_kECBBfG7EMtuR1CjP9mblP7gXdZ89QDnOFsF6TzMKW', {
  api_host: 'https://app.posthog.com',
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  advanced_disable_decide: true,
})

export { posthog }
