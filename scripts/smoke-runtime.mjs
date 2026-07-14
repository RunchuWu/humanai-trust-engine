#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_TIMEOUT_MS = 5000;

function printUsage() {
  console.log(`Usage:
  npm run smoke:runtime
  npm run smoke:runtime -- --base-url http://localhost:3000

Options:
  --base-url <url>     Base URL for a running app. Default: ${DEFAULT_BASE_URL}
  --timeout-ms <ms>    Per-request timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --help              Show this help message.
`);
}

function parseInteger(flag, value) {
  if (value === undefined) {
    throw new Error(`${flag} requires a value.`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    help: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--base-url") {
      options.baseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--timeout-ms") {
      options.timeoutMs = parseInteger(arg, argv[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (typeof options.baseUrl !== "string" || options.baseUrl.length === 0) {
    throw new Error("--base-url must be a non-empty URL.");
  }

  try {
    new URL(options.baseUrl);
  } catch {
    throw new Error("--base-url must be a valid URL.");
  }

  return options;
}

const checks = [
  {
    path: "/",
    expectedStatus: 307,
    expectedHeaders: {
      location: "/task",
    },
  },
  {
    path: "/task",
    expectedStatus: 200,
    expectedHeaders: {
      "content-type": "text/html",
    },
  },
  {
    path: "/task?debug=1",
    expectedStatus: 200,
    expectedHeaders: {
      "content-type": "text/html",
    },
  },
  {
    path: "/api/runs",
    expectedStatus: 200,
    expectedHeaders: {
      "content-type": "application/json",
    },
  },
  {
    path: "/api/export?format=json",
    expectedStatus: 200,
    expectedHeaders: {
      "content-type": "application/json",
    },
  },
  {
    path: "/api/export?format=csv",
    expectedStatus: 200,
    expectedHeaders: {
      "content-disposition": "events.csv",
      "content-type": "text/csv",
    },
  },
  {
    path: "/api/events/preview?limit=5",
    expectedStatus: 200,
    expectedHeaders: {
      "content-type": "application/json",
    },
  },
];

function makeUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

async function fetchHead(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function validateHeaders(response, expectedHeaders) {
  const errors = [];

  for (const [name, expectedValue] of Object.entries(expectedHeaders)) {
    const actualValue = response.headers.get(name);
    if (actualValue === null) {
      errors.push(`missing header ${name}`);
      continue;
    }

    if (!actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
      errors.push(
        `header ${name} expected to include ${expectedValue}, got ${actualValue}`,
      );
    }
  }

  return errors;
}

async function runCheck(baseUrl, timeoutMs, check) {
  const url = makeUrl(baseUrl, check.path);

  try {
    const response = await fetchHead(url, timeoutMs);
    const errors = [];

    if (response.status !== check.expectedStatus) {
      errors.push(
        `expected status ${check.expectedStatus}, got ${response.status}`,
      );
    }

    errors.push(...validateHeaders(response, check.expectedHeaders));

    return {
      errors,
      path: check.path,
      status: response.status,
      url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [`request failed: ${message}`],
      path: check.path,
      status: "request-error",
      url,
    };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  console.log(`Runtime smoke base URL: ${options.baseUrl}`);
  console.log(`Per-request timeout: ${options.timeoutMs} ms`);

  const results = [];
  for (const check of checks) {
    results.push(await runCheck(options.baseUrl, options.timeoutMs, check));
  }

  console.log("\n| Path | Status | Result |");
  console.log("| --- | --- | --- |");
  for (const result of results) {
    const status = String(result.status);
    const summary =
      result.errors.length === 0 ? "passed" : result.errors.join("; ");
    console.log(`| \`${result.path}\` | ${status} | ${summary} |`);
  }

  const failures = results.filter((result) => result.errors.length > 0);

  if (failures.length > 0) {
    console.error("\nRuntime smoke check failed.");
    process.exitCode = 1;
    return;
  }

  console.log("\nRuntime smoke check passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
