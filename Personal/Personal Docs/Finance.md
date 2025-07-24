---
cssclasses:
  - full-width-edit
  - full-width-preview
"obsidianUIMode:": preview
---

```dataviewjs
const version = "1.3.0";
const mode = "individual"; // "indidivual "or "company"
/*
───────────────────────────────────────────────────────────────────────────────
DataviewJS – Collect component buckets, numeric tasks, currencies, and totals
───────────────────────────────────────────────────────────────────────────────
*/

const itemParentLocation = {
	file: "Personal Priorities",
	parentText: /^\[\[Finance\]\](?: \^[\w-]+)?$/     // [[Finance]]  or  [[Finance]] ^blockID
};

const { file, parentText: FINANCE_REGEX } = itemParentLocation;

/* ────────────────────────────────────────────────────────────────────────────
1. Grab ALL list items (checkboxes and plain bullets)
──────────────────────────────────────────────────────────────────────────── */
const allListItems = dv.page(file).file.lists;

/* ────────────────────────────────────────────────────────────────────────────
2. Locate the [[Finance]] parent item
──────────────────────────────────────────────────────────────────────────── */
let financeItem = allListItems
	.where(i => FINANCE_REGEX.test(i.text.trim()))
	.first();

if (!financeItem) {
	throw "Finance item not found";
}

// Prune the tree to exclude items with status "-" or "x"
function pruneTree(item) {
	if (!item || (item.status && (item.status === "-" || item.status === "x"))) return null;
	
	const pruned = { ...item }; // Shallow copy
	pruned.children = (item.children || []).map(pruneTree).filter(child => child !== null);
	return pruned;
}

financeItem = pruneTree(financeItem);

/* ────────────────────────────────────────────────────────────────────────────
3. Component-bucket patterns (flexible, case-insensitive)
──────────────────────────────────────────────────────────────────────────── */
const componentPatterns = {
	currentAccounts:    /\b(current\s+accounts?|checking\s+accounts?)\b/i,
	creditCards:        /\b(credit\s+cards?)\b/i,
	savingsAccounts:    /\b(savings?\s+accounts?)\b/i,
	investmentAccounts: /\b(investment\s+accounts?|investments?)\b/i,
	currentAssets:      /\b(current\s+assets?)\b/i,
	fixedAssets:        /\b(fixed\s+assets?)\b/i,
	currentLiabilities: /\b(current\s+liabilities)\b/i,
	fixedLiabilities:   /\b(fixed\s+liabilities|long[\s-]?term\s+liabilities)\b/i,
	income: /^\*\*Income\*\*(?: \^[\w-]+)?$/i,
	expenditures: /^\*\*Expenditures\*\*(?: \^[\w-]+)?$/i
};

/* ────────────────────────────────────────────────────────────────────────────
4. Currency symbol / code helpers
──────────────────────────────────────────────────────────────────────────── */
const currencySymbols = [
	'$', '£', '€', '¥', '₹', '₽', '₩', '₪', '₦', '₨', '₱', '₡', '₵', '₴', '₸',
	'₼', '₾', '₿', '¢', '₢', '₣', '₤', '₥', '₧', '₫', '₭', '₮', '₯', '₰', '₲',
	'₳', '₶', '₷', '₺', '₻', '￥', '￡', '￦'
];

const codeToSymbol = {
	USD: '$', GBP: '£', EUR: '€', JPY: '¥', CNY: '¥', INR: '₹', RUB: '₽',
	KRW: '₩', ILS: '₪', NGN: '₦', PKR: '₨', PHP: '₱', CRC: '₡', GHS: '₵',
	UAH: '₴', KZT: '₸', AZN: '₼', GEL: '₾', BTC: '₿'
};

// Exhaustive list of fiat currencies (ISO 4217 codes + symbols)
const fiatCurrencies = new Set([
	// Major currencies
	'USD', '$', 'EUR', '€', 'GBP', '£', 'JPY', '¥', 'CHF', 'CAD', 'AUD', 'NZD',
	// Asian currencies
	'CNY', 'INR', '₹', 'KRW', '₩', 'SGD', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', '₱',
	'VND', 'KHR', 'LAK', 'MMK', 'BND', 'NPR', 'BTN', 'LKR', 'MVR', 'PKR', '₨',
	// European currencies
	'NOK', 'SEK', 'DKK', 'ISK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD',
	'BAM', 'MKD', 'ALL', 'MDL', 'UAH', '₴', 'BYN', 'RUB', '₽', 'GEL', '₾', 'AMD',
	'AZN', '₼', 'TRY', '₺', 'CYP', 'MTL',
	// Middle Eastern currencies
	'SAR', 'AED', 'QAR', 'BHD', 'KWD', 'OMR', 'JOD', 'ILS', '₪', 'LBP', 'SYP', 'IQD', 'IRR', 'AFN',
	// African currencies
	'ZAR', 'EGP', 'NGN', '₦', 'KES', 'UGX', 'TZS', 'RWF', 'ETB', 'GHS', '₵', 'XOF', 'XAF',
	'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'SOS', 'DJF', 'ERN', 'MWK', 'ZMW', 'BWP', 'SZL',
	'LSL', 'NAD', 'AOA', 'MZN', 'MGA', 'KMF', 'SCR', 'MUR', 'CVE', 'GMD', 'GNF', 'LRD',
	'SLL', 'STN', 'BIF', 'CDF', 'XPF',
	// American currencies
	'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB', 'VES', 'GYD', 'SRD',
	'TTD', 'BBD', 'JMD', 'BSD', 'BZD', 'GTQ', 'HNL', 'NIO', 'CRC', '₡', 'PAB', 'CUP', 'DOP',
	'HTG', 'AWG', 'ANG', 'XCD', 'KYD', 'BMD', 'FKP', 'GIP', 'SHP',
	// Oceanian currencies
	'FJD', 'PGK', 'SBD', 'TOP', 'VUV', 'WST', 'KID', 'TVD', 'NRU',
	// Other currencies
	'MNT', 'KZT', '₸', 'UZS', 'TJS', 'KGS', 'TMT', 'BDT', 'MOP', 'KPW'
]);

// Escape regex special chars in symbol list
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const currencySymbolPattern = `[${currencySymbols.map(esc).join('')}]`;
const currencyCodePattern   = '[A-Z]{3,5}';   // 3–5 uppercase letters (stricter, min 3)

/* ────────────────────────────────────────────────────────────────────────────
5. Helper function to determine if currency is fiat or crypto
──────────────────────────────────────────────────────────────────────────── */
function isFiatCurrency(currency) {
	return fiatCurrencies.has(currency);
}

function roundAmount(amount, currency) {
	if (isFiatCurrency(currency)) {
		return Math.round((amount + Number.EPSILON) * 100) / 100;
	}
	return amount; // No rounding for crypto
}

/* ────────────────────────────────────────────────────────────────────────────
6. Helper function to normalize amounts to monthly equivalents
──────────────────────────────────────────────────────────────────────────── */
function normalizeToMonthly(amount, mult, period) {
	if (!period) return amount; // No period specified, will be handled by caller
	
	switch (period.toLowerCase()) {
		case 'd':  // daily
			return amount * 30.44; // average days per month (ignores mult in original)
		case 'w':  // weekly
			return amount * (4.33 / mult); // average weeks per month, adjusted for every X weeks
		case 'bw': // biweekly (every 2 weeks)
			return amount * 2.17; // 26 biweekly periods per year / 12 months (ignores mult)
		case 'm':  // monthly
			return amount / mult; // every X months
		case 'y':  // yearly
			return amount / (mult * 12); // every X years to monthly
		default:
			return amount;
	}
}

/* ────────────────────────────────────────────────────────────────────────────
7. Extract first monetary value & currency from a text line
   • Handles negatives, commas, decimals
   • Picks FIRST number (ignores text after '/')
   • Prefers code when both symbol & code present
   • Now captures optional /period after amount
──────────────────────────────────────────────────────────────────────────── */
function extractMoney(text) {
    // Remove markdown links first: [text](url) → text
    let cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
    // Remove HTML anchors: <a ...>text</a> → text
    cleanText = cleanText.replace(/<a[^>]*>([^<]+)<\/a>/g, '$1');
  
    // Try multiple patterns to extract monetary values, now with optional /period
    const patterns = [
        // Pattern 1: Symbol followed by amount (e.g., "£150,000", "-£444.01") + optional /period
        new RegExp(`(-?)(${currencySymbolPattern})\\s*([\\d,]+(?:\\.\\d+)?)(?:\\s*/(\\d*)([dwmy]|bw))?`, 'i'),
        // Pattern 2: Amount followed by currency code (e.g., "1000 USD") + optional /period
        new RegExp(`(-?)([\\d,]+(?:\\.\\d+)?)\\s+(${currencyCodePattern})(?:\\s*/(\\d*)([dwmy]|bw))?`, 'i'),
        // Pattern 3: Just symbol and amount anywhere in text + optional /period
        new RegExp(`(-?)(${currencySymbolPattern})([\\d,]+(?:\\.\\d+)?)(?:\\s*/(\\d*)([dwmy]|bw))?`, 'i'),
        // Pattern 4: Just amount and code anywhere in text + optional /period
        new RegExp(`(-?)([\\d,]+(?:\\.\\d+)?)\\s*(${currencyCodePattern})(?:\\s*/(\\d*)([dwmy]|bw))?`, 'i')
    ];
  
    for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
            let minus, symbol, amount, code, periodMultiplier, periodUnit;
          
            if (pattern === patterns[0] || pattern === patterns[2]) {
                // Symbol + amount patterns
                [, minus, symbol, amount, periodMultiplier, periodUnit] = match;
                code = null;
            } else {
                // Amount + code patterns
                [, minus, amount, code, periodMultiplier, periodUnit] = match;
                symbol = null;
            }
          
            const numericAmount = parseFloat(amount.replace(/,/g, '')) * (minus === '-' ? -1 : 1);
          
            // Determine currency: prefer code over symbol if both present
            let currencyRaw = code || symbol;
            if (!currencyRaw) continue;
          
            // Normalize currency to uppercase for codes
            currencyRaw = currencyRaw.toUpperCase();
          
            // Validate currency code length (min 3 for codes)
            if (!symbol && currencyRaw.length < 3) continue;
          
            // Normalize currency
            let currencyNorm;
            if (codeToSymbol[currencyRaw]) {
                currencyNorm = codeToSymbol[currencyRaw];          // USD → $
            } else if (currencySymbols.includes(currencyRaw)) {
                currencyNorm = currencyRaw;                        // $ stays $
            } else {
                currencyNorm = currencyRaw;                        // Unknown code stays as code
            }
          
            // Capture period if present
            periodMultiplier = periodMultiplier ? parseInt(periodMultiplier) : 1;
            periodUnit = periodUnit || null;
          
            return { amount: numericAmount, currency: currencyNorm, periodMultiplier, periodUnit };
        }
    }
  
    return null;
}

/* ────────────────────────────────────────────────────────────────────────────
8. DFS to locate component buckets
──────────────────────────────────────────────────────────────────────────── */
const componentBuckets = {};
const seenLines = new Set();

function dfsFindBuckets(item) {
	if (!item || seenLines.has(item.line)) return;
	seenLines.add(item.line);

	for (const [bucket, pat] of Object.entries(componentPatterns)) {
		if (pat.test(item.text)) {
			componentBuckets[bucket] = {
				item,
				numericTasks: [],
				currencies: []   // will become array of {code, total}
			};
		}
	}
	(item.children ?? []).forEach(dfsFindBuckets);
}
dfsFindBuckets(financeItem);

/* ────────────────────────────────────────────────────────────────────────────
9. For each bucket → gather numeric tasks (descendants) & compute totals
──────────────────────────────────────────────────────────────────────────── */
function collectNumericTasks(parent) {
	const tasks = [];
	const visited = new Set();
	function dfs(item) {
		if (!item || visited.has(item.line)) return;
		visited.add(item.line);
		// Include if has digit and (no status or status != ' ')
		if (/\d/.test(item.text) && (!item.status || item.status !== ' ')) tasks.push(item);
		(item.children ?? []).forEach(dfs);
	}
	(parent.children ?? []).forEach(dfs);
	return tasks;
}

Object.entries(componentBuckets).forEach(([bucketName, bucket]) => {
	bucket.numericTasks = collectNumericTasks(bucket.item);

	// Map currency → total
	const totals = new Map();

	bucket.numericTasks.forEach(task => {
		const money = extractMoney(task.text);
		if (money) {
			let { amount, currency, periodMultiplier = 1, periodUnit = null } = money;
			let normalizedAmount = amount;
			if (bucketName === 'income' || bucketName === 'expenditures') {
				if (!periodUnit) periodUnit = 'y'; // Assume yearly if not specified for income/expenditures
				normalizedAmount = normalizeToMonthly(amount, periodMultiplier, periodUnit);
				// Force correct sign based on bucket (robust for data with/without '-' in text)
				if (bucketName === 'expenditures') {
					normalizedAmount = -Math.abs(normalizedAmount); // Always negative for expenditures
				} else if (bucketName === 'income') {
					normalizedAmount = Math.abs(normalizedAmount); // Always positive for income
				}
			}
			if (!totals.has(currency)) totals.set(currency, 0);
			totals.set(currency, totals.get(currency) + normalizedAmount);
		}
	});

	bucket.currencies = Array.from(totals.entries())
		.map(([code, total]) => ({
			code,
			total: roundAmount(total, code)
		}));
});

/* ────────────────────────────────────────────────────────────────────────────
10. Calculate financial metrics
──────────────────────────────────────────────────────────────────────────── */

// Helper function to get totals by currency for a bucket
function getTotalsByCurrency(bucketName) {
	const bucket = componentBuckets[bucketName];
	if (!bucket) return new Map();
	
	const totals = new Map();
	bucket.currencies.forEach(({ code, total }) => {
		totals.set(code, total);
	});
	return totals;
}

// Helper function to get all unique currencies across buckets
function getAllCurrencies(...bucketNames) {
	const currencies = new Set();
	bucketNames.forEach(bucketName => {
		const bucket = componentBuckets[bucketName];
		if (bucket) {
			bucket.currencies.forEach(({ code }) => currencies.add(code));
		}
	});
	return Array.from(currencies);
}

// Calculate Real Balance = Current Accounts + Credit Cards (credit cards are negative)
const currentAccountTotals = getTotalsByCurrency('currentAccounts');
const creditCardTotals = getTotalsByCurrency('creditCards');
const realBalanceCurrencies = getAllCurrencies('currentAccounts', 'creditCards');

componentBuckets.realBalance = realBalanceCurrencies.map(currency => ({
	code: currency,
	total: roundAmount((currentAccountTotals.get(currency) || 0) + (creditCardTotals.get(currency) || 0), currency)
}));

// Calculate Savings Balance = sum of savings accounts
const savingsTotals = getTotalsByCurrency('savingsAccounts');
componentBuckets.savingsBalance = Array.from(savingsTotals.entries()).map(([code, total]) => ({
	code,
	total: roundAmount(total, code)
}));

// Calculate Investment Balance = sum of investment accounts
const investmentTotals = getTotalsByCurrency('investmentAccounts');
componentBuckets.investmentBalance = Array.from(investmentTotals.entries()).map(([code, total]) => ({
	code,
	total: roundAmount(total, code)
}));

// Total Income and Expenditures are already calculated in the main loop above
// Just create references for easier access
componentBuckets.totalIncome = componentBuckets.income?.currencies || [];
componentBuckets.totalExpenditures = componentBuckets.expenditures?.currencies || [];

/* ────────────────────────────────────────────────────────────────────────────
10.1 Add savingsTransactions bucket: DFS for tasks containing '(Saving)'
──────────────────────────────────────────────────────────────────────────── */

// Collect numeric tasks for savingsTransactions (no specific item, search whole finance tree)
componentBuckets.savingsTransactions = {
	numericTasks: [],
	currencies: []
};

const savingsTasks = [];
const visitedSavings = new Set();
function dfsSavings(item) {
	if (!item || visitedSavings.has(item.line)) return;
	visitedSavings.add(item.line);
	if (item.text.includes('(Saving)') && /\d/.test(item.text) && (!item.status || item.status !== ' ')) savingsTasks.push(item);
	(item.children ?? []).forEach(dfsSavings);
}
dfsSavings(financeItem);

componentBuckets.savingsTransactions.numericTasks = savingsTasks;

// Compute totals for savingsTransactions (normalize to monthly like income/expenditures)
const savingsTotalsMap = new Map();
componentBuckets.savingsTransactions.numericTasks.forEach(task => {
	const money = extractMoney(task.text);
	if (money) {
		let { amount, currency, periodMultiplier = 1, periodUnit = null } = money;
		if (!periodUnit) periodUnit = 'y'; // Assume yearly if not specified
		const normalizedAmount = normalizeToMonthly(amount, periodMultiplier, periodUnit);
		if (!savingsTotalsMap.has(currency)) savingsTotalsMap.set(currency, 0);
		savingsTotalsMap.set(currency, savingsTotalsMap.get(currency) + normalizedAmount);
	}
});

componentBuckets.savingsTransactions.currencies = Array.from(savingsTotalsMap.entries())
	.map(([code, total]) => ({
		code,
		total: roundAmount(total, code)
	}));

/* ────────────────────────────────────────────────────────────────────────────
10.2 Add totalInvestments bucket with investmentTransactions and retirementTransactions
──────────────────────────────────────────────────────────────────────────── */

// Collect numeric tasks for investmentTransactions and retirementTransactions
componentBuckets.totalInvestments = {
    investmentTransactions: {
        numericTasks: [],
        currencies: []
    },
    retirementTransactions: {
        numericTasks: [],
        currencies: []
    }
};

const investmentTasks = [];
const retirementTasks = [];
const visitedInvestments = new Set();
function dfsInvestments(item) {
    if (!item || visitedInvestments.has(item.line)) return;
    visitedInvestments.add(item.line);
    if (item.text.includes('(Investment Account)') && /\d/.test(item.text) && (!item.status || item.status !== ' ')) investmentTasks.push(item);
    if (item.text.includes('(Retirement Account)') && /\d/.test(item.text) && (!item.status || item.status !== ' ')) retirementTasks.push(item);
    (item.children ?? []).forEach(dfsInvestments);
}
dfsInvestments(financeItem);

componentBuckets.totalInvestments.investmentTransactions.numericTasks = investmentTasks;
componentBuckets.totalInvestments.retirementTransactions.numericTasks = retirementTasks;

// Compute totals for investmentTransactions and retirementTransactions (normalize to monthly)
function computeMonthlyTotals(tasks, target) {
    const totalsMap = new Map();
    tasks.forEach(task => {
        const money = extractMoney(task.text);
        if (money) {
            let { amount, currency, periodMultiplier = 1, periodUnit = null } = money;
            if (!periodUnit) periodUnit = 'y'; // Assume yearly if not specified
            const normalizedAmount = normalizeToMonthly(amount, periodMultiplier, periodUnit);
            if (!totalsMap.has(currency)) totalsMap.set(currency, 0);
            totalsMap.set(currency, totalsMap.get(currency) + normalizedAmount);
        }
    });
    target.currencies = Array.from(totalsMap.entries()).map(([code, total]) => ({
        code,
        total: roundAmount(total, code)
    }));
}

computeMonthlyTotals(investmentTasks, componentBuckets.totalInvestments.investmentTransactions);
computeMonthlyTotals(retirementTasks, componentBuckets.totalInvestments.retirementTransactions);

/* ────────────────────────────────────────────────────────────────────────────
11. Calculate Net Worth with normalization currency support
──────────────────────────────────────────────────────────────────────────── */

// Global normalization currency variable (default to £)
window.normalizationCurrency = window.normalizationCurrency || '£';

// Global normalization frequency variable (default to monthly)
window.normalizationFrequency = window.normalizationFrequency || 'monthly';

// Helper: map symbol to ISO code for API and display
const symbolToCodeMap = {
	'£': 'GBP',
	'$': 'USD',
	'€': 'EUR',
	'¥': 'JPY',
	'₹': 'INR',
	'₽': 'RUB',
	'₩': 'KRW',
	'₪': 'ILS',
	'₦': 'NGN',
	'₨': 'PKR',
	'₱': 'PHP',
	'₡': 'CRC',
	'₵': 'GHS',
	'₴': 'UAH',
	'₸': 'KZT',
	'₼': 'AZN',
	'₾': 'GEL'
};

// Convert currency code or symbol to API code
function toApiCode(codeOrSymbol) {
	if (symbolToCodeMap[codeOrSymbol]) return symbolToCodeMap[codeOrSymbol];
	if (codeToSymbol[codeOrSymbol]) return codeOrSymbol; // Already ISO code
	return codeOrSymbol; // fallback
}

// Convert amount from source currency to target currency using exchange rates
async function convertCurrency(amount, fromCurrency, toCurrency, exchangeRates) {
	if (fromCurrency === toCurrency) return amount;
	
	const fromCode = toApiCode(fromCurrency);
	const toCode = toApiCode(toCurrency);
	
	if (!exchangeRates) throw new Error("Exchange rates not provided");
	
	// Rates are relative to USD base in exchangerate-api
	// Convert fromCurrency → USD → toCurrency
	const rateFromUSD = exchangeRates.rates[toCode];
	const rateToUSD = exchangeRates.rates[fromCode];
	
	if (!rateFromUSD || !rateToUSD) throw new Error(`Missing exchange rate for ${fromCode} or ${toCode}`);
	
	const amountInUSD = amount / rateToUSD;
	const converted = amountInUSD * rateFromUSD;
	return converted;
}

// Fetch exchange rates once per run
async function fetchExchangeRates() {
	const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
	if (!response.ok) throw new Error("Failed to fetch exchange rates");
	return await response.json();
}

// Calculate net worth normalized to selected currency
async function calculateNetWorthNormalized() {
	const fixedAssetTotals = getTotalsByCurrency('fixedAssets');
	const fixedLiabilityTotals = getTotalsByCurrency('fixedLiabilities');
	const netWorthCurrencies = getAllCurrencies('fixedAssets', 'fixedLiabilities');
	
	const exchangeRates = await fetchExchangeRates();
	const targetCurrency = window.normalizationCurrency;
	
	let totalNormalized = 0;
	const details = [];
	
	for (const currency of netWorthCurrencies) {
		const total = (fixedAssetTotals.get(currency) || 0) + (fixedLiabilityTotals.get(currency) || 0);
		if (total === 0) continue;
		try {
			const converted = await convertCurrency(total, currency, targetCurrency, exchangeRates);
			totalNormalized += converted;
			details.push({
				currency,
				amount: total,
				converted,
			});
		} catch (e) {
			details.push({
				currency,
				amount: total,
				converted: null,
				error: e.message
			});
		}
	}
	
	return {
		totalNormalized: Math.round((totalNormalized + Number.EPSILON) * 100) / 100,
		details
	};
}

/* ────────────────────────────────────────────────────────────────────────────
12. Add targets componentBucket with savingInvestDebt.targetFunction and sufficientRealBalance
──────────────────────────────────────────────────────────────────────────── */

componentBuckets.targets = {
	savInvDebtPercentage: {
		targetFunction: function(savInvDebtTotal, totalIncome) {
			if (!totalIncome || isNaN(savInvDebtTotal) || isNaN(totalIncome)) return [false, 0];
			const percent = (savInvDebtTotal / totalIncome) * 100;
			const isWithinRange = percent >= 15 && percent <= 25;
			return [isWithinRange, percent];
		}
	},
	sufficientRealBalance: {
		targetFunction: function(totalExpenditure, realBalance) {
			if (!totalExpenditure || totalExpenditure >= 0 || isNaN(totalExpenditure) || isNaN(realBalance)) return [false, 0, 0];
			const absExpenditure = Math.abs(totalExpenditure);
			// Round up to nearest 500
			const roundedExpenditure = Math.ceil(absExpenditure / 500) * 500;
			const lowerBound = roundedExpenditure;
			const upperBound = roundedExpenditure * 2;
			const isWithinRange = realBalance >= lowerBound && realBalance <= upperBound;
			return [isWithinRange, lowerBound, upperBound];
		}
	},
	savingsTarget: {
		targetFunction: function(totalExpenditure, totalSavings) {
			if (!totalExpenditure || totalExpenditure >= 0 || isNaN(totalExpenditure) || isNaN(totalSavings)) return [false, 0, 0];
			const absExpenditure = Math.abs(totalExpenditure);
			// Round up to nearest 500
			const roundedExpenditure = Math.ceil(absExpenditure / 500) * 500;
			const lowerBound = roundedExpenditure * 6;
			const upperBound = roundedExpenditure * 8;
			const isWithinRange = totalSavings >= lowerBound && totalSavings <= upperBound;
			return [isWithinRange, lowerBound, upperBound];
		}
	},
	invCoreTarget: {
	    targetFunction: function(realBalance, sufficientRealBalanceTuple, savingsBalance, savingsTargetTuple, totalInvestments, totalIncome) {
	        if (isNaN(totalInvestments) || isNaN(totalIncome) || totalIncome === 0) return [false, 0, ''];
	        
	        const percentage = (totalInvestments / totalIncome) * 100;
	        const isWithinRange = percentage >= 20;
	        
	        const warnings = [];
	        const [realWithinRange] = sufficientRealBalanceTuple;
	        const [savingsWithinRange] = savingsTargetTuple;
	        
	        const realAboveOrWithin = realBalance >= sufficientRealBalanceTuple[1]; // Within or above
	        const savingsAboveOrWithin = savingsBalance >= savingsTargetTuple[1]; // Within or above
	        
	        if (!realAboveOrWithin) warnings.push('Real Balance');
	        if (!savingsAboveOrWithin) warnings.push('Savings');
	        
	        let warningString = '';
	        if (warnings.length > 0) {
	            const joined = warnings.join(' & ');
	            let additionalMessage = '';
	            if (totalInvestments === 0) {
	                additionalMessage = ' - investing paused';
	            } else {
	                additionalMessage = ' - pause investments immediately';
	            }
	            warningString = `<mark style="background: #FEE12B; color: #000000"><strong>⚠️ ${joined} is below the target${additionalMessage}</strong></mark>`;
	        }
	        
	        return [isWithinRange, percentage, warningString];
	    }
	}
};

/* ────────────────────────────────────────────────────────────────────────────
13. Display financial metrics in dv.el with normalization currency UI toggle
──────────────────────────────────────────────────────────────────────────── */

// Helper function to format currency amounts
function formatCurrency(code, amount, fractionDigits = null) {
	const absAmount = Math.abs(amount);
	const options = {
		minimumFractionDigits: fractionDigits !== null ? fractionDigits : (isFiatCurrency(code) ? 2 : 0),
		maximumFractionDigits: fractionDigits !== null ? fractionDigits : (isFiatCurrency(code) ? 2 : 8)
	};
	const formattedAmount = absAmount.toLocaleString(undefined, options);
	
	const sign = amount < 0 ? '-' : '';
	
	if (isFiatCurrency(code)) {
		// Place minus before symbol, e.g. -£2,154.66
		return `${sign}${code}${formattedAmount}`;
	} else {
		// For crypto or unknown, place minus before amount, e.g. -0.12345678 BTC
		return `${sign}${formattedAmount} ${code}`;
	}
}

// Helper function to create currency display elements with normalized amounts and bullet formatting
function createCurrencyDisplayWithNormalization(balances, normalizationCurrency, exchangeRates) {
	if (balances.length === 0) return '<div>No data available</div>';
	
	// Calculate total normalized amount
	let totalNormalized = 0;
	const items = [];
	
	balances.forEach(({ code, total }) => {
		let converted = null;
		if (exchangeRates && total !== 0) {
			try {
				converted = convertCurrencySync(total, code, normalizationCurrency, exchangeRates);
				totalNormalized += converted;
			} catch {
				converted = null;
			}
		}
		if (total !== 0) items.push({ code, total, converted });
	});
	
	// If only one item and no normalization needed, show just total (no list)
	if (items.length === 1 && (items[0].code === normalizationCurrency || items[0].converted === null)) {
		return `<div>${formatCurrency(items[0].code, items[0].total)}</div>`;
	}
	
	let html = '';
	if (!isNaN(totalNormalized) && totalNormalized !== 0) { html += `<div>${formatCurrency(normalizationCurrency, totalNormalized)}</div>`; }
	
	// Build a proper unordered list for the amounts
	html += '<ul style="margin-top: 0; margin-bottom: 0;">';
	
	items.forEach(({ code, total, converted }) => {
		let text = formatCurrency(code, total);
		if (converted !== null && code !== normalizationCurrency) {
			text += ` → ${formatCurrency(normalizationCurrency, converted)}`;
		}
		html += `<li>${text}</li>`;
	});
	
	html += '</ul>';
	
	return html || '<div>No data available</div>';
}

// Synchronous currency conversion helper for display (uses cached exchangeRates)
function convertCurrencySync(amount, fromCurrency, toCurrency, exchangeRates) {
	if (fromCurrency === toCurrency) return amount;
	
	const fromCode = toApiCode(fromCurrency);
	const toCode = toApiCode(toCurrency);
	
	const rateFromUSD = exchangeRates.rates[toCode];
	const rateToUSD = exchangeRates.rates[fromCode];
	
	if (!rateFromUSD || !rateToUSD) throw new Error(`Missing exchange rate for ${fromCode} or ${toCode}`);
	
	const amountInUSD = amount / rateToUSD;
	const converted = amountInUSD * rateFromUSD;
	return converted;
}

// Helper function to scale monthly rate to target frequency
function scaleToFrequency(monthlyAmount, frequency) {
    switch (frequency) {
        case 'daily':
            return monthlyAmount / 30.44; // Average days per month
        case 'weekly':
            return monthlyAmount / (30.44 / 7); // Average weeks per month ≈ 4.348
        case 'monthly':
            return monthlyAmount;
        case 'annual':
            return monthlyAmount * 12;
        default:
            return monthlyAmount;
    }
}

// Get frequency suffix for display (e.g., /d, /w, /m, /y)
function getFrequencySuffix(frequency) {
    switch (frequency) {
        case 'daily': return '/d';
        case 'weekly': return '/w';
        case 'monthly': return '/m';
        case 'annual': return '/y';
        default: return '/m';
    }
}

// Define mode-specific headers (emojis remain the same)
const headers = {
    income: mode === "company" ? "💼 Total Revenue" : "💼 Total Income",
    expenditures: "💸 Total Expenditures",
    realBalance: mode === "company" ? "💳 Working Capital" : "💳 Real Balance",
    savings: mode === "company" ? "💰 Cash-on-Hand" : "💰 Savings Balance",
    investment: mode === "company" ? "📈 Investment Portfolio" : "📈 Investment Balance",
    netWorth: mode === "company" ? "🏦 Shareholder Equity" : "🏦 Net Worth"
};

// Create the main financial summary container
dv.el("h3", "💰 Financial Summary");

// Build list of currencies with both symbol and code
const currenciesWithSymbolAndCode = Object.entries(codeToSymbol)
	.filter(([code, symbol]) => currencySymbols.includes(symbol))
	.map(([code, symbol]) => ({ code, symbol }));

// Create a flex container for the controls
const headerContainer = document.createElement('div');
headerContainer.style.display = "flex";
headerContainer.style.alignItems = "center";
headerContainer.style.gap = "10px";

// Version (bold)
const versionText = document.createElement('strong');
versionText.textContent = `Financial Obsidian v${version}`;
headerContainer.appendChild(versionText);

// Currency selector
const normalizationSelect = document.createElement('select');
currenciesWithSymbolAndCode.forEach(({ code, symbol }) => {
    const option = document.createElement('option');
    option.value = symbol;
    option.textContent = code;
    if (symbol === window.normalizationCurrency) option.selected = true;
    normalizationSelect.appendChild(option);
});
headerContainer.appendChild(normalizationSelect);

// Frequency selector
const frequencySelect = document.createElement('select');
['Daily', 'Weekly', 'Monthly', 'Annual'].forEach(freq => {
    const value = freq.toLowerCase();
    const option = document.createElement('option');
    option.value = value;
    option.textContent = freq;
    if (value === window.normalizationFrequency) option.selected = true;
    frequencySelect.appendChild(option);
});
headerContainer.appendChild(frequencySelect);

// Add the headerContainer to the page
dv.container.appendChild(headerContainer);

// State: current normalization currency and frequency
let normalizationCurrency = window.normalizationCurrency;
let normalizationFrequency = window.normalizationFrequency;

// Cached exchange rates for synchronous conversions
let cachedExchangeRates = null;

// Update normalization currency on change
normalizationSelect.addEventListener("change", async (e) => {
	normalizationCurrency = e.target.value;
	window.normalizationCurrency = normalizationCurrency;
	await updateAllDisplays();
});

// Update normalization frequency on change
frequencySelect.addEventListener("change", async (e) => {
	normalizationFrequency = e.target.value;
	window.normalizationFrequency = normalizationFrequency;
	await updateAllDisplays();
});

// Create placeholders for each section (with initial content to avoid empties) and store h4 references for dynamic updates
const incomeHeader = dv.el("h4", headers.income + " (Monthly)");
const incomePlaceholder = dv.el("div", "Calculating...");
dv.container.appendChild(incomeHeader);
dv.container.appendChild(incomePlaceholder);

const expendituresHeader = dv.el("h4", headers.expenditures + " (Monthly)");
const expendituresPlaceholder = dv.el("div", "Calculating...");
dv.container.appendChild(expendituresHeader);
dv.container.appendChild(expendituresPlaceholder);

const realBalanceHeader = dv.el("h4", headers.realBalance);
const realBalancePlaceholder = dv.el("div", "Calculating...");
dv.container.appendChild(realBalanceHeader);
dv.container.appendChild(realBalancePlaceholder);

const savingsHeader = dv.el("h4", headers.savings);
const savingsPlaceholder = dv.el("div", "Calculating...");
dv.container.appendChild(savingsHeader);
dv.container.appendChild(savingsPlaceholder);

// Investment Balance (initially hidden)
const investmentHeader = dv.el("h4", headers.investment);
const investmentPlaceholder = dv.el("div", "Calculating...");
dv.container.appendChild(investmentHeader);
dv.container.appendChild(investmentPlaceholder);
investmentHeader.style.display = 'none'; // Start hidden
investmentPlaceholder.style.display = 'none'; // Start hidden

// Net Worth (initially hidden)
const netWorthHeader = dv.el("h4", headers.netWorth);
const netWorthPlaceholder = dv.el("div", "Calculating...");
dv.container.appendChild(netWorthHeader);
dv.container.appendChild(netWorthPlaceholder);
netWorthHeader.style.display = 'none'; // Start hidden
netWorthPlaceholder.style.display = 'none'; // Start hidden

// Update all displays with normalization
async function updateAllDisplays() {
	try {
		if (!cachedExchangeRates) {
			cachedExchangeRates = await fetchExchangeRates();
		}
		
		// Update headers with current frequency (capitalized)
		const freqCapitalized = normalizationFrequency.charAt(0).toUpperCase() + normalizationFrequency.slice(1);
		incomeHeader.textContent = `${headers.income} (${freqCapitalized})`;
		expendituresHeader.textContent = `${headers.expenditures} (${freqCapitalized})`;
		// Other headers (balances) don't change as they are absolute
		
		// Income (scale monthly to selected frequency)
		let incomeHtml = createCurrencyDisplayWithNormalization(
			componentBuckets.totalIncome.map(({ code, total }) => ({ code, total: scaleToFrequency(total, normalizationFrequency) })),
			normalizationCurrency,
			cachedExchangeRates
		);
		incomePlaceholder.innerHTML = incomeHtml;
		
		// Expenditures (scale monthly to selected frequency)
		let expendituresHtml = createCurrencyDisplayWithNormalization(
			componentBuckets.totalExpenditures.map(({ code, total }) => ({ code, total: scaleToFrequency(total, normalizationFrequency) })),
			normalizationCurrency,
			cachedExchangeRates
		);
		expendituresPlaceholder.innerHTML = expendituresHtml;
		
		// Real Balance with target display
		// Calculate normalized total expenditure (sum of all converted expenditures) - use MONTHLY for targets
		let normalizedTotalExpenditureMonthly = 0;
		componentBuckets.totalExpenditures.forEach(({ code, total }) => {
		    if (total !== 0) {
		        try {
		            const converted = convertCurrencySync(total, code, normalizationCurrency, cachedExchangeRates);
		            normalizedTotalExpenditureMonthly += converted;
		        } catch {}
		    }
		});
		
		// Scale expenditure to selected frequency for display purposes (but targets use monthly)
		const normalizedTotalExpenditure = scaleToFrequency(normalizedTotalExpenditureMonthly, normalizationFrequency);
		
		// Calculate normalized total income (sum of all converted incomes) - use MONTHLY for targets, scale for display
		let normalizedTotalIncomeMonthly = 0;
		componentBuckets.totalIncome.forEach(({ code, total }) => {
		    if (total !== 0) {
		        try {
		            const converted = convertCurrencySync(total, code, normalizationCurrency, cachedExchangeRates);
		            normalizedTotalIncomeMonthly += converted;
		        } catch {}
		    }
		});
		const normalizedTotalIncome = scaleToFrequency(normalizedTotalIncomeMonthly, normalizationFrequency);
		
		// Calculate growth rate (net change: income + expenditure) - scaled to frequency
		const growthRate = normalizedTotalIncome + normalizedTotalExpenditure;
		
		// Determine growth background color
		let growthBackground = 'transparent'; // Default for zero (unlikely)
		const growthSign = growthRate === 0 ? '±' : growthRate >= 0 ? '+' : '-';
		if (growthRate > 0) {
		    growthBackground = '#2E8B57'; // Green for positive
		} else if (growthRate < 0) {
		    growthBackground = '#BF0A30'; // Red for negative
		}
		
		// Format growth rate (e.g., (+£300/m) or (-£100/m)) - use frequency suffix
		const freqSuffix = getFrequencySuffix(normalizationFrequency);
		const formattedGrowth = `<mark style="background: ${growthBackground};">${growthSign}${formatCurrency(normalizationCurrency, Math.abs(growthRate), 0)}${freqSuffix}</mark>${growthSign === '+' ? ' ✅' : ' ❌'}`;
		
		// Calculate normalized real balance (sum of all converted real balances) - absolute, no scaling
		let normalizedRealBalance = 0;
		componentBuckets.realBalance.forEach(({ code, total }) => {
		    if (total !== 0) {
		        try {
		            const converted = convertCurrencySync(total, code, normalizationCurrency, cachedExchangeRates);
		            normalizedRealBalance += converted;
		        } catch {}
		    }
		});
		
		// Use target function to check if real balance is within 1-2 months of rounded expenditure (uses MONTHLY expenditure)
		const [isWithinRange, lowerBound, upperBound] = componentBuckets.targets.sufficientRealBalance.targetFunction(normalizedTotalExpenditureMonthly, normalizedRealBalance);
		
		// Determine direction for arrows if out of range
		let realBalanceDirection = '';
		let realGrowthDirection = ''; // Will match balance direction if showing ❌
		if (!isWithinRange) {
		    if (normalizedRealBalance < lowerBound) {
		        realBalanceDirection = '🔽';
		    } else if (normalizedRealBalance > upperBound) {
		        realBalanceDirection = '🔼';
		    }
		    // For growth: Add arrow only if showing ❌ (negative growth)
		    if (growthSign !== '+' && growthSign !== '±') { // Assuming ' ❌' is shown for negative growth
		        realGrowthDirection = realBalanceDirection; // Match balance direction
		    }
		}
		
		// Format bounds as positive integers (no decimals)
		const formattedLower = formatCurrency(normalizationCurrency, lowerBound, 0).replace(/^-/, ''); // Remove sign if any
		const formattedUpper = formatCurrency(normalizationCurrency, upperBound, 0).replace(/^-/, ''); // Remove sign if any
		
		// Wrap in strong, with target inside the mark for the balance
		const backgroundColor = isWithinRange ? '#2E8B57' : '#BF0A30';
		const realBalanceDisplay = `<strong><mark style="background: ${backgroundColor};">${formatCurrency(normalizationCurrency, normalizedRealBalance)} / ${formattedLower} - ${formattedUpper}</mark>${isWithinRange ? ' ✅' : ` ❌${realBalanceDirection}`} ${formattedGrowth.replace(/ ❌/, ` ❌${realGrowthDirection}`)}</strong>`; // Append arrow to growth ❌ if applicable
		
		// Render real balance display + list items (but exclude the total since we're showing it in the mark)
		let realBalanceHtml = `<div>${realBalanceDisplay}</div>`;
		realBalanceHtml += createCurrencyDisplayWithNormalization(componentBuckets.realBalance, normalizationCurrency, cachedExchangeRates).replace(/<div>.*<\/div>/, ''); // Remove the total div from the list HTML
		realBalancePlaceholder.innerHTML = realBalanceHtml;
		
		// Savings Balance with target display
		// Calculate normalized total savings (sum of all converted savings balances) - absolute, no scaling
		let normalizedTotalSavings = 0;
		componentBuckets.savingsBalance.forEach(({ code, total }) => {
		    if (total !== 0) {
		        try {
		            const converted = convertCurrencySync(total, code, normalizationCurrency, cachedExchangeRates);
		            normalizedTotalSavings += converted;
		        } catch {}
		    }
		});
		
		// Calculate normalized savings transactions (growth/shrinkage) - monthly, then scale to frequency
		let normalizedSavingsTransactionsMonthly = 0;
		componentBuckets.savingsTransactions.currencies.forEach(({ code, total }) => {
		    if (total !== 0) {
		        try {
		            const converted = convertCurrencySync(total, code, normalizationCurrency, cachedExchangeRates);
		            normalizedSavingsTransactionsMonthly += converted;
		        } catch {}
		    }
		});
		const normalizedSavingsTransactions = scaleToFrequency(normalizedSavingsTransactionsMonthly, normalizationFrequency);
		
		// Use target function to check if savings balance is within 6-8 months of rounded expenditure (uses MONTHLY expenditure)
		const [savingsIsWithinRange, savingsLowerBound, savingsUpperBound] = componentBuckets.targets.savingsTarget.targetFunction(normalizedTotalExpenditureMonthly, normalizedTotalSavings);
		
		// Determine savings balance state: above, in_range, or below
		let savingsBalanceState = 'below'; // Default
		if (normalizedTotalSavings > savingsUpperBound) {
		    savingsBalanceState = 'above';
		} else if (savingsIsWithinRange) {
		    savingsBalanceState = 'in_range';
		}
		
		// Determine savings change state: increasing, decreasing, or neutral
		let savingsChangeState = 'neutral'; // Default
		if (normalizedSavingsTransactions < 0) {
		    savingsChangeState = 'increasing';
		} else if (normalizedSavingsTransactions > 0) {
		    savingsChangeState = 'decreasing';
		}
		
		// Determine sign for display
		let savingsGrowthSign = normalizedSavingsTransactions === 0 ? '±' : normalizedSavingsTransactions < 0 ? '+' : '-';
		
		// Determine highlight color and emoji based on balance state and change state
		let savingsGrowthBackground = 'transparent'; // Default
		let savingsGrowthEmoji = ''; // Default to none
		
		if (savingsBalanceState === 'above') {
		    // Positive or neutral: red with cross
		    if (savingsChangeState === 'increasing' || savingsChangeState === 'neutral') {
		        savingsGrowthBackground = '#BF0A30'; // Red
		        savingsGrowthEmoji = ' ❌';
		    }
		    // Decreasing: (not specified, so default to transparent with no emoji)
		} else if (savingsBalanceState === 'in_range') {
		    if (savingsChangeState === 'increasing' || savingsChangeState === 'neutral') {
		        savingsGrowthBackground = '#2E8B57'; // Green
		        savingsGrowthEmoji = ' ✅';
		    } else if (savingsChangeState === 'decreasing') {
		        savingsGrowthBackground = '#FEE12B'; // Yellow
		        savingsGrowthEmoji = ''; // No emoji
		    }
		} else if (savingsBalanceState === 'below') {
		    if (savingsChangeState === 'increasing') {
		        savingsGrowthBackground = '#2E8B57'; // Green
		        savingsGrowthEmoji = ' ✅';
		    } else if (savingsChangeState === 'neutral' || savingsChangeState === 'decreasing') {
		        savingsGrowthBackground = '#BF0A30'; // Red
		        savingsGrowthEmoji = ' ❌';
		    }
		}
		
		// Determine direction for arrows if out of range
		let savingsBalanceDirection = '';
		let savingsGrowthDirection = ''; // Will match balance direction if showing ❌
		if (!savingsIsWithinRange) {
		    if (normalizedTotalSavings < savingsLowerBound) {
		        savingsBalanceDirection = '🔽';
		    } else if (normalizedTotalSavings > savingsUpperBound) {
		        savingsBalanceDirection = '🔼';
		    }
		    // For growth: Add arrow only if showing ❌
		    if (savingsGrowthEmoji === ' ❌') {
		        savingsGrowthDirection = savingsBalanceDirection; // Match balance direction
		    }
		}
		
		// Format savings growth rate (e.g., (+£300/m) or (-£250/m))
		const formattedSavingsGrowth = `<mark style="background: ${savingsGrowthBackground};">${savingsGrowthSign}${formatCurrency(normalizationCurrency, Math.abs(normalizedSavingsTransactions), 0)}${freqSuffix}</mark>${savingsGrowthEmoji}${savingsGrowthDirection}`;
		
		// Format bounds as positive integers (no decimals)
		const formattedSavingsLower = formatCurrency(normalizationCurrency, savingsLowerBound, 0).replace(/^-/, ''); // Remove sign if any
		const formattedSavingsUpper = formatCurrency(normalizationCurrency, savingsUpperBound, 0).replace(/^-/, ''); // Remove sign if any
		
		// Wrap in strong, with target inside the mark for the balance
		const savingsBackgroundColor = savingsIsWithinRange ? '#2E8B57' : '#BF0A30';
		const savingsBalanceDisplay = `<strong><mark style="background: ${savingsBackgroundColor};">${formatCurrency(normalizationCurrency, normalizedTotalSavings)} / ${formattedSavingsLower} - ${formattedSavingsUpper}</mark> ${savingsIsWithinRange ? ' ✅' : ` ❌${savingsBalanceDirection}`} ${formattedSavingsGrowth}</strong>`;
		
		// Render savings balance display + list items (but exclude the total since we're showing it in the mark)
		let savingsHtml = `<div>${savingsBalanceDisplay}</div>`;
		savingsHtml += createCurrencyDisplayWithNormalization(componentBuckets.savingsBalance, normalizationCurrency, cachedExchangeRates).replace(/<div>.*<\/div>/, ''); // Remove the total div from the list HTML
		savingsPlaceholder.innerHTML = savingsHtml;
		
		// Investment Balance with target display
		// First, calculate normalized total investments (monthly change: sum of investment + retirement transactions) - monthly, then scale
		let normalizedTotalInvestmentsMonthly = 0;
		[...componentBuckets.totalInvestments.investmentTransactions.currencies, ...componentBuckets.totalInvestments.retirementTransactions.currencies].forEach(({ code, total }) => {
		    if (total !== 0) {
		        try {
		            const converted = convertCurrencySync(total, code, normalizationCurrency, cachedExchangeRates);
		            normalizedTotalInvestmentsMonthly += converted;
		        } catch {}
		    }
		});
		const normalizedTotalInvestments = scaleToFrequency(normalizedTotalInvestmentsMonthly, normalizationFrequency);
		
		// Reverse the sign for display and calculations (since investments are expenditure figures)
		const displayedInvestments = -normalizedTotalInvestments;
		const absInvestments = Math.abs(normalizedTotalInvestments); // Use absolute for percentage (scaled)
		
		// Use target function for investments (use MONTHLY values for checks)
		const sufficientRealBalanceTuple = componentBuckets.targets.sufficientRealBalance.targetFunction(normalizedTotalExpenditureMonthly, normalizedRealBalance);
		const savingsTargetTuple = componentBuckets.targets.savingsTarget.targetFunction(normalizedTotalExpenditureMonthly, normalizedTotalSavings);
		const [invWithinRange, , invWarning] = componentBuckets.targets.invCoreTarget.targetFunction(
		    normalizedRealBalance,
		    sufficientRealBalanceTuple,
		    normalizedTotalSavings,
		    savingsTargetTuple,
		    Math.abs(normalizedTotalInvestmentsMonthly), // Use monthly absolute for target check
		    normalizedTotalIncomeMonthly // Use monthly income for percentage
		);
		
		// Recalculate percentage using absolute investments (monthly, since target is 20% of monthly income)
		const percentage = (Math.abs(normalizedTotalInvestmentsMonthly) / normalizedTotalIncomeMonthly) * 100;
		const roundedPercentage = Math.round(percentage);
		const isPercentageTargetMet = percentage >= 20; // Base check for no-warning case
		
		// New logic: Determine if the investment state is "good" based on warning presence
		let isInvestmentGood = false;
		let investmentEmoji = ' ❌'; // Default to bad
		
		if (invWarning) {
		    // When there's a warning, good only if investment amount is exactly 0 (investing should stop)
		    isInvestmentGood = absInvestments === 0;
		} else {
		    // No warning: good if percentage >= 20%
		    isInvestmentGood = isPercentageTargetMet;
		}
		
		if (isInvestmentGood) {
		    investmentEmoji = ' ✅';
		}
		
		// Determine direction for arrow if showing ❌ (only too low possible)
		let investmentDirection = '';
		if (investmentEmoji === ' ❌') {
		    investmentDirection = '⬇️'; // Too low (below 20%)
		}
		
		// Calculate the target value (20% of total income) - scaled to frequency for display
		const targetInvestmentDecimal = 0.2;
		const targetInvestmentPercentage = `${100 * targetInvestmentDecimal}%`;
		const targetInvestmentMonthly = normalizedTotalIncomeMonthly * targetInvestmentDecimal;
		const targetInvestment = scaleToFrequency(targetInvestmentMonthly, normalizationFrequency);
		
		// Determine sign for monthly change (based on displayed value)
		const invSign = displayedInvestments === 0 ? '±' : displayedInvestments >= 0 ? '+' : '-';
		
		// Format the monthly change line (use scaled values and frequency suffix)
		const formattedMonthlyChange = `${invSign}${formatCurrency(normalizationCurrency, Math.abs(displayedInvestments), 0)}${freqSuffix} (${roundedPercentage}%)`;
		
		// Wrap in strong with mark and background color
		const invBackgroundColor = isInvestmentGood ? '#2E8B57' : '#BF0A30'; // Green if good, red otherwise
		const monthlyChangeDisplay = `<mark style="background: ${invBackgroundColor};"><strong>${formattedMonthlyChange}${invWarning && displayedInvestments > 0 ? ` / ${formatCurrency(normalizationCurrency, 0, 0)} (0%)` : invWarning && displayedInvestments === 0 ? "" : ` / ${formatCurrency(normalizationCurrency, targetInvestment, 0)} (${targetInvestmentPercentage})`}</strong></mark>${investmentEmoji}${investmentDirection} ${invWarning ? ` ${invWarning}` : ''}`;
		
		// Get the base investment balance HTML (absolute, no scaling)
		let investmentHtml = createCurrencyDisplayWithNormalization(componentBuckets.investmentBalance, normalizationCurrency, cachedExchangeRates);
		
		// Insert the monthly change line right after the total (or as the second line if no list)
		investmentHtml = investmentHtml.replace(/<\/div>/, ` ${monthlyChangeDisplay}</div>`);
		
		investmentPlaceholder.innerHTML = investmentHtml;

		// Conditionally show/hide Investment Balance section
		const hasInvestmentData = componentBuckets.investmentBalance.length > 0 && componentBuckets.investmentBalance.some(({ total }) => total !== 0);
		investmentHeader.style.display = hasInvestmentData ? 'block' : 'none';
		investmentPlaceholder.style.display = hasInvestmentData ? 'block' : 'none';
		
		// Net Worth (absolute, no scaling)
		netWorthPlaceholder.innerHTML = "Calculating...";
		const netWorthResult = await calculateNetWorthNormalized();
		
		const details = netWorthResult.details.filter(d => d.amount !== 0);
		const singleItemNoNormalization = details.length === 1 && 
			(details[0].currency === normalizationCurrency || details[0].converted === null);
		
		if (singleItemNoNormalization) {
			// Show just the total amount (no list)
			netWorthPlaceholder.innerHTML = `<div>${formatCurrency(details[0].currency, details[0].amount)}</div>`;
		} else {
			// Show total normalized + unordered list with bullets
			let netWorthHtml = '';
			if (!isNaN(netWorthResult.totalNormalized) && netWorthResult.totalNormalized !== 0) {
				netWorthHtml += `<div>${formatCurrency(normalizationCurrency, netWorthResult.totalNormalized)}</div>`;
			}
			netWorthHtml += '<ul style="margin-top: 0; margin-bottom: 0;">';
			details.forEach(detail => {
				let text = formatCurrency(detail.currency, detail.amount);
				if (detail.converted !== null && detail.currency !== normalizationCurrency) {
					text += ` → ${formatCurrency(normalizationCurrency, detail.converted)}`;
				}
				netWorthHtml += `<li>${text}</li>`;
			});
			netWorthHtml += '</ul>';
			netWorthPlaceholder.innerHTML = netWorthHtml || '<div>No data available</div>';
		}

		// Conditionally show/hide Net Worth section
		const hasNetWorthData = details.length > 0 && netWorthResult.totalNormalized !== 0;
		netWorthHeader.style.display = hasNetWorthData ? 'block' : 'none';
		netWorthPlaceholder.style.display = hasNetWorthData ? 'block' : 'none';
	} catch (e) {
		netWorthPlaceholder.innerHTML = `Error updating display: ${e.message}`;
		console.error(e);
	}
}

// Initial display update
updateAllDisplays();

// Expose normalizationCurrency globally for other parts of your code
window.normalizationCurrency = normalizationCurrency;
window.normalizationFrequency = normalizationFrequency;
window.componentBuckets = componentBuckets;
```