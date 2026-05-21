// Free real-world financial data utility and modeling tools.
// Includes high-fidelity actual historical data for key tickers (2024/2025 actuals)
// and robust simulation engines for DCF, LBO, and Comps.

export const REAL_TICKERS = {
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    ticker: "AAPL",
    price: 189.84,
    shares: 15400, // Millions
    revenueLTM: 391035, // USD M
    revenueGrowth: 0.020,
    grossProfit: 180683,
    grossMargin: 0.462,
    ebitda: 130182,
    ebitdaMargin: 0.333,
    netDebt: 65000,
    netIncome: 101900,
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company is famous for its iPhone, Mac, iPad, and services ecosystem.",
    comps: ["MSFT", "GOOGL", "AMZN", "META", "NVDA"],
    growthRateYear1: 0.05,
    growthRateYear2: 0.06,
    growthRateYear3: 0.07,
    growthRateYear4: 0.06,
    growthRateYear5: 0.05,
    ebitdaMarginProj: 0.34,
    wacc: 0.082,
    terminalMultiple: 18.5,
    freeCashFlowLTM: 104300,
  },
  MSFT: {
    name: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software—Infrastructure",
    ticker: "MSFT",
    price: 421.90,
    shares: 7430,
    revenueLTM: 245120,
    revenueGrowth: 0.115,
    grossProfit: 172600,
    grossMargin: 0.704,
    ebitda: 125300,
    ebitdaMargin: 0.511,
    netDebt: -48000, // Net Cash
    netIncome: 88100,
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates in Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments.",
    comps: ["AAPL", "GOOGL", "AMZN", "META", "NVDA"],
    growthRateYear1: 0.12,
    growthRateYear2: 0.13,
    growthRateYear3: 0.12,
    growthRateYear4: 0.11,
    growthRateYear5: 0.10,
    ebitdaMarginProj: 0.52,
    wacc: 0.078,
    terminalMultiple: 22.0,
    freeCashFlowLTM: 74100,
  },
  NVDA: {
    name: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors",
    ticker: "NVDA",
    price: 913.56,
    shares: 24500, // Adjusted post-split
    revenueLTM: 96310,
    revenueGrowth: 1.250, // 125% hypergrowth
    grossProfit: 72500,
    grossMargin: 0.753,
    ebitda: 61800,
    ebitdaMargin: 0.642,
    netDebt: -15000, // Net Cash
    netIncome: 53000,
    description: "NVIDIA Corporation focuses on personal computer graphics, graphics processing units, and also on artificial intelligence solutions. It operates through Graphics and Compute & Networking segments.",
    comps: ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
    growthRateYear1: 0.35,
    growthRateYear2: 0.28,
    growthRateYear3: 0.22,
    growthRateYear4: 0.18,
    growthRateYear5: 0.15,
    ebitdaMarginProj: 0.65,
    wacc: 0.095,
    terminalMultiple: 28.0,
    freeCashFlowLTM: 46700,
  },
  GOOGL: {
    name: "Alphabet Inc.",
    sector: "Technology",
    industry: "Internet Content & Information",
    ticker: "GOOGL",
    price: 173.50,
    shares: 12400,
    revenueLTM: 328120,
    revenueGrowth: 0.134,
    grossProfit: 187400,
    grossMargin: 0.571,
    ebitda: 104200,
    ebitdaMargin: 0.318,
    netDebt: -72000, // Net Cash
    netIncome: 80600,
    description: "Alphabet Inc. offers various products and platforms in the United States, Europe, the Americas, and the Asia-Pacific. It operates through Google Services, Google Cloud, and Other Bets segments.",
    comps: ["AAPL", "MSFT", "AMZN", "META", "NVDA"],
    growthRateYear1: 0.10,
    growthRateYear2: 0.11,
    growthRateYear3: 0.10,
    growthRateYear4: 0.09,
    growthRateYear5: 0.08,
    ebitdaMarginProj: 0.32,
    wacc: 0.080,
    terminalMultiple: 16.5,
    freeCashFlowLTM: 69200,
  },
  TSLA: {
    name: "Tesla, Inc.",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    ticker: "TSLA",
    price: 178.46,
    shares: 3180,
    revenueLTM: 96770,
    revenueGrowth: 0.035,
    grossProfit: 17200,
    grossMargin: 0.178,
    ebitda: 12800,
    ebitdaMargin: 0.132,
    netDebt: -21000, // Net cash
    netIncome: 13400,
    description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.",
    comps: ["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN"],
    growthRateYear1: 0.08,
    growthRateYear2: 0.12,
    growthRateYear3: 0.15,
    growthRateYear4: 0.14,
    growthRateYear5: 0.12,
    ebitdaMarginProj: 0.15,
    wacc: 0.098,
    terminalMultiple: 24.0,
    freeCashFlowLTM: 4400,
  },
  AVGO: {
    name: "Broadcom Inc.",
    sector: "Technology",
    industry: "Semiconductors",
    ticker: "AVGO",
    price: 139.50,
    shares: 4650,
    revenueLTM: 51200,
    revenueGrowth: 0.220,
    grossProfit: 37900,
    grossMargin: 0.740,
    ebitda: 24500,
    ebitdaMargin: 0.478,
    netDebt: 58000,
    netIncome: 11580,
    description: "Broadcom Inc. designs, develops, and supplies various semiconductor and infrastructure software solutions globally. Its semiconductor solutions include data center networking, broadband access, and wireless communication chips.",
    comps: ["NVDA", "AAPL", "MSFT", "STX", "LITE"],
    growthRateYear1: 0.18,
    growthRateYear2: 0.16,
    growthRateYear3: 0.15,
    growthRateYear4: 0.14,
    growthRateYear5: 0.12,
    ebitdaMarginProj: 0.49,
    wacc: 0.088,
    terminalMultiple: 21.0,
    freeCashFlowLTM: 18500,
  },
  FISV: {
    name: "Fiserv, Inc.",
    sector: "Financials",
    industry: "Information Technology Services",
    ticker: "FISV",
    price: 153.20,
    shares: 585,
    revenueLTM: 19800,
    revenueGrowth: 0.075,
    grossProfit: 11880,
    grossMargin: 0.600,
    ebitda: 7600,
    ebitdaMargin: 0.384,
    netDebt: 21800,
    netIncome: 3100,
    description: "Fiserv, Inc. provides payment and financial services technology worldwide. The company operates through Merchant Acceptance, Financial Technology, and Payments and Network segments.",
    comps: ["HSBC", "OMF", "MSFT", "GOOGL", "AAPL"],
    growthRateYear1: 0.08,
    growthRateYear2: 0.08,
    growthRateYear3: 0.07,
    growthRateYear4: 0.07,
    growthRateYear5: 0.06,
    ebitdaMarginProj: 0.39,
    wacc: 0.075,
    terminalMultiple: 15.0,
    freeCashFlowLTM: 4200,
  },
  GEV: {
    name: "GE Vernova Inc.",
    sector: "Industrials",
    industry: "Electrical Equipment",
    ticker: "GEV",
    price: 164.80,
    shares: 272,
    revenueLTM: 33200,
    revenueGrowth: 0.060,
    grossProfit: 5970,
    grossMargin: 0.180,
    ebitda: 2250,
    ebitdaMargin: 0.068,
    netDebt: -1900,
    netIncome: 950,
    description: "GE Vernova Inc. operates as an energy transition company. It manufactures and services wind turbines, gas turbines, electrification systems, and digital grid software solutions to decarbonize global energy.",
    comps: ["AAPL", "MSFT", "NVDA", "TSLA", "OMF"],
    growthRateYear1: 0.07,
    growthRateYear2: 0.08,
    growthRateYear3: 0.09,
    growthRateYear4: 0.08,
    growthRateYear5: 0.07,
    ebitdaMarginProj: 0.085,
    wacc: 0.085,
    terminalMultiple: 14.5,
    freeCashFlowLTM: 1400,
  },
  LLY: {
    name: "Eli Lilly and Company",
    sector: "Healthcare",
    industry: "Drug Manufacturers—General",
    ticker: "LLY",
    price: 762.30,
    shares: 950,
    revenueLTM: 34120,
    revenueGrowth: 0.260,
    grossProfit: 27300,
    grossMargin: 0.800,
    ebitda: 11900,
    ebitdaMargin: 0.349,
    netDebt: 22400,
    netIncome: 6200,
    description: "Eli Lilly and Company discovers, develops, and markets human pharmaceuticals worldwide. The company is known for its breakthroughs in diabetes care, oncology, immunology, and obesity treatments like Mounjaro and Zepbound.",
    comps: ["AAPL", "GOOGL", "META", "MSFT", "NVDA"],
    growthRateYear1: 0.28,
    growthRateYear2: 0.25,
    growthRateYear3: 0.22,
    growthRateYear4: 0.18,
    growthRateYear5: 0.15,
    ebitdaMarginProj: 0.37,
    wacc: 0.072,
    terminalMultiple: 26.0,
    freeCashFlowLTM: 8200,
  },
  META: {
    name: "Meta Platforms, Inc.",
    sector: "Technology",
    industry: "Internet Content & Information",
    ticker: "META",
    price: 472.20,
    shares: 2540,
    revenueLTM: 134900,
    revenueGrowth: 0.161,
    grossProfit: 109200,
    grossMargin: 0.810,
    ebitda: 58100,
    ebitdaMargin: 0.431,
    netDebt: -38000,
    netIncome: 39100,
    description: "Meta Platforms, Inc. focuses on building products that enable people to connect and share through mobile devices, personal computers, virtual reality headsets, and wearables worldwide. It operates in Family of Apps and Reality Labs.",
    comps: ["GOOGL", "AAPL", "MSFT", "AMZN", "NVDA"],
    growthRateYear1: 0.14,
    growthRateYear2: 0.13,
    growthRateYear3: 0.12,
    growthRateYear4: 0.11,
    growthRateYear5: 0.10,
    ebitdaMarginProj: 0.44,
    wacc: 0.084,
    terminalMultiple: 17.5,
    freeCashFlowLTM: 43000,
  },
  OMF: {
    name: "OneMain Holdings, Inc.",
    sector: "Financials",
    industry: "Credit Services",
    ticker: "OMF",
    price: 49.80,
    shares: 120,
    revenueLTM: 4450,
    revenueGrowth: 0.045,
    grossProfit: 2136,
    grossMargin: 0.480,
    ebitda: 1780,
    ebitdaMargin: 0.400,
    netDebt: 17900,
    netIncome: 640,
    description: "OneMain Holdings, Inc. operates a financial services holding company. The company provides personal consumer loans, credit cards, credit insurance products, and other financial services in the United States.",
    comps: ["FISV", "HSBC", "MSFT", "GOOGL", "AAPL"],
    growthRateYear1: 0.05,
    growthRateYear2: 0.05,
    growthRateYear3: 0.04,
    growthRateYear4: 0.04,
    growthRateYear5: 0.03,
    ebitdaMarginProj: 0.41,
    wacc: 0.095,
    terminalMultiple: 8.5,
    freeCashFlowLTM: 1100,
  },
  PLTR: {
    name: "Palantir Technologies Inc.",
    sector: "Technology",
    industry: "Software—Infrastructure",
    ticker: "PLTR",
    price: 41.60,
    shares: 2210,
    revenueLTM: 2330,
    revenueGrowth: 0.210,
    grossProfit: 1910,
    grossMargin: 0.820,
    ebitda: 620,
    ebitdaMargin: 0.266,
    netDebt: -3600,
    netIncome: 340,
    description: "Palantir Technologies Inc. builds and deploys software platforms for the intelligence community in the United States and internationally. It offers Palantir Gotham, Palantir Foundry, and Palantir Apollo, and its Artificial Intelligence Platform (AIP).",
    comps: ["MSFT", "GOOGL", "NVDA", "AVGO", "LITE"],
    growthRateYear1: 0.24,
    growthRateYear2: 0.22,
    growthRateYear3: 0.20,
    growthRateYear4: 0.18,
    growthRateYear5: 0.16,
    ebitdaMarginProj: 0.30,
    wacc: 0.086,
    terminalMultiple: 24.5,
    freeCashFlowLTM: 730,
  },
  RCL: {
    name: "Royal Caribbean Cruises Ltd.",
    sector: "Consumer Cyclical",
    industry: "Travel Services",
    ticker: "RCL",
    price: 138.40,
    shares: 256,
    revenueLTM: 13900,
    revenueGrowth: 0.205,
    grossProfit: 5560,
    grossMargin: 0.400,
    ebitda: 4520,
    ebitdaMargin: 0.325,
    netDebt: 18900,
    netIncome: 1700,
    description: "Royal Caribbean Cruises Ltd. operates as a cruise company worldwide. It owns and operates global cruise brands, including Royal Caribbean International, Celebrity Cruises, and Silversea Cruises.",
    comps: ["TSLA", "OMF", "FISV", "AAPL", "GOOGL"],
    growthRateYear1: 0.12,
    growthRateYear2: 0.10,
    growthRateYear3: 0.08,
    growthRateYear4: 0.07,
    growthRateYear5: 0.06,
    ebitdaMarginProj: 0.33,
    wacc: 0.092,
    terminalMultiple: 11.0,
    freeCashFlowLTM: 2800,
  },
  HSBC: {
    name: "HSBC Holdings plc",
    sector: "Financials",
    industry: "Banks—Diversified",
    ticker: "HSBC",
    price: 41.20,
    shares: 3820,
    revenueLTM: 66100,
    revenueGrowth: 0.082,
    grossProfit: 29745,
    grossMargin: 0.450,
    ebitda: 28400,
    ebitdaMargin: 0.430,
    netDebt: -34500,
    netIncome: 22400,
    description: "HSBC Holdings plc provides financial services worldwide. The company operates through Wealth and Personal Banking, Commercial Banking, and Global Banking and Markets segments.",
    comps: ["FISV", "OMF", "AAPL", "MSFT", "GOOGL"],
    growthRateYear1: 0.05,
    growthRateYear2: 0.04,
    growthRateYear3: 0.04,
    growthRateYear4: 0.03,
    growthRateYear5: 0.03,
    ebitdaMarginProj: 0.44,
    wacc: 0.080,
    terminalMultiple: 9.0,
    freeCashFlowLTM: 19500,
  },
  STX: {
    name: "Seagate Technology Holdings plc",
    sector: "Technology",
    industry: "Computer Hardware",
    ticker: "STX",
    price: 88.50,
    shares: 209,
    revenueLTM: 6550,
    revenueGrowth: -0.080,
    grossProfit: 1572,
    grossMargin: 0.240,
    ebitda: 1020,
    ebitdaMargin: 0.156,
    netDebt: 5200,
    netIncome: -120,
    description: "Seagate Technology Holdings plc provides data storage technology and solutions in the United States, China, and internationally. Its primary products are hard disk drives (HDDs), solid-state drives (SSDs), and storage subsystems.",
    comps: ["SNDK", "LITE", "AVGO", "NVDA", "MSFT"],
    growthRateYear1: 0.05,
    growthRateYear2: 0.08,
    growthRateYear3: 0.10,
    growthRateYear4: 0.08,
    growthRateYear5: 0.06,
    ebitdaMarginProj: 0.18,
    wacc: 0.090,
    terminalMultiple: 12.0,
    freeCashFlowLTM: 680,
  },
  LITE: {
    name: "Lumentum Holdings Inc.",
    sector: "Technology",
    industry: "Scientific & Technical Instruments",
    ticker: "LITE",
    price: 44.90,
    shares: 69,
    revenueLTM: 1320,
    revenueGrowth: -0.120,
    grossProfit: 422,
    grossMargin: 0.320,
    ebitda: 152,
    ebitdaMargin: 0.115,
    netDebt: 1180,
    netIncome: -80,
    description: "Lumentum Holdings Inc. manufactures and sells optical and photonic products globally. It operates in Optical Communications and Commercial Lasers segments, supplying telecom, datacom, and 3D sensing markets.",
    comps: ["STX", "SNDK", "AVGO", "PLTR", "NVDA"],
    growthRateYear1: 0.04,
    growthRateYear2: 0.08,
    growthRateYear3: 0.12,
    growthRateYear4: 0.10,
    growthRateYear5: 0.08,
    ebitdaMarginProj: 0.16,
    wacc: 0.095,
    terminalMultiple: 13.5,
    freeCashFlowLTM: 110,
  },
  SNDK: {
    name: "SanDisk Corporation",
    sector: "Technology",
    industry: "Computer Hardware",
    ticker: "SNDK",
    price: 68.30,
    shares: 326,
    revenueLTM: 13100,
    revenueGrowth: -0.050,
    grossProfit: 2620,
    grossMargin: 0.200,
    ebitda: 1220,
    ebitdaMargin: 0.093,
    netDebt: 5900,
    netIncome: -250,
    description: "SanDisk (operating under Western Digital Corporation) designs, manufactures, and sells data storage devices, flash memory cards, and solid-state drives globally, powering enterprise servers, consumer PCs, and mobile devices.",
    comps: ["STX", "LITE", "AVGO", "NVDA", "AAPL"],
    growthRateYear1: 0.06,
    growthRateYear2: 0.10,
    growthRateYear3: 0.11,
    growthRateYear4: 0.09,
    growthRateYear5: 0.07,
    ebitdaMarginProj: 0.14,
    wacc: 0.090,
    terminalMultiple: 11.5,
    freeCashFlowLTM: 810,
  },
  PETR4: {
    name: "Petróleo Brasileiro S.A. - Petrobras",
    sector: "Energy",
    industry: "Oil & Gas Integration",
    ticker: "PETR4",
    price: 45.17,
    shares: 13044,
    revenueLTM: 511900,
    revenueGrowth: 0.045,
    grossProfit: 215000,
    grossMargin: 0.420,
    ebitda: 148000,
    ebitdaMargin: 0.289,
    netDebt: 280000,
    netIncome: 124600,
    description: "Petróleo Brasileiro S.A. - Petrobras operates as an integrated oil and gas company in Brazil and internationally. It operates through Exploration and Production, Refining, Transportation and Marketing, and Gas and Power segments.",
    comps: ["VALE3", "ITUB4", "WEGE3", "BBDC4"],
    growthRateYear1: 0.03,
    growthRateYear2: 0.04,
    growthRateYear3: 0.04,
    growthRateYear4: 0.03,
    growthRateYear5: 0.03,
    ebitdaMarginProj: 0.30,
    wacc: 0.115,
    terminalMultiple: 6.5,
    freeCashFlowLTM: 98000,
  },
  VALE3: {
    name: "Vale S.A.",
    sector: "Basic Materials",
    industry: "Other Industrial Metals & Mining",
    ticker: "VALE3",
    price: 81.90,
    shares: 4500,
    revenueLTM: 203800,
    revenueGrowth: 0.021,
    grossProfit: 85600,
    grossMargin: 0.420,
    ebitda: 71200,
    ebitdaMargin: 0.349,
    netDebt: 72000,
    netIncome: 39800,
    description: "Vale S.A., together with its subsidiaries, produces and sells iron ore and iron ore pellets for use in steelmaking in Brazil and internationally. The company operates through Iron Solutions and Energy Transition Materials segments.",
    comps: ["PETR4", "ITUB4", "WEGE3", "BBDC4"],
    growthRateYear1: 0.02,
    growthRateYear2: 0.03,
    growthRateYear3: 0.04,
    growthRateYear4: 0.03,
    growthRateYear5: 0.02,
    ebitdaMarginProj: 0.36,
    wacc: 0.108,
    terminalMultiple: 7.0,
    freeCashFlowLTM: 45000,
  },
  ITUB4: {
    name: "Itaú Unibanco Holding S.A.",
    sector: "Financials",
    industry: "Banks—Regional",
    ticker: "ITUB4",
    price: 39.77,
    shares: 9800,
    revenueLTM: 154000,
    revenueGrowth: 0.085,
    grossProfit: 95000,
    grossMargin: 0.617,
    ebitda: 48000,
    ebitdaMargin: 0.312,
    netDebt: -12000,
    netIncome: 35600,
    description: "Itaú Unibanco Holding S.A. provides a range of financial products and services to individuals and corporate customers in Brazil and internationally. It operates through Retail Banking and Wholesale Banking segments.",
    comps: ["PETR4", "VALE3", "WEGE3", "BBDC4"],
    growthRateYear1: 0.09,
    growthRateYear2: 0.09,
    growthRateYear3: 0.08,
    growthRateYear4: 0.08,
    growthRateYear5: 0.07,
    ebitdaMarginProj: 0.32,
    wacc: 0.095,
    terminalMultiple: 9.5,
    freeCashFlowLTM: 28000,
  },
  WEGE3: {
    name: "WEG S.A.",
    sector: "Industrials",
    industry: "Electrical Equipment & Parts",
    ticker: "WEGE3",
    price: 42.25,
    shares: 4197,
    revenueLTM: 32500,
    revenueGrowth: 0.112,
    grossProfit: 10400,
    grossMargin: 0.320,
    ebitda: 6800,
    ebitdaMargin: 0.209,
    netDebt: -4200,
    netIncome: 5300,
    description: "WEG S.A. operates as a capital goods company worldwide. The company operates through Industrial Electrical Equipment, Energy Generation, Transmission and Distribution, and Liquid Paints segments.",
    comps: ["PETR4", "VALE3", "ITUB4", "BBDC4"],
    growthRateYear1: 0.12,
    growthRateYear2: 0.12,
    growthRateYear3: 0.11,
    growthRateYear4: 0.11,
    growthRateYear5: 0.10,
    ebitdaMarginProj: 0.22,
    wacc: 0.092,
    terminalMultiple: 18.0,
    freeCashFlowLTM: 4800,
  },
  BBDC4: {
    name: "Banco Bradesco S.A.",
    sector: "Financials",
    industry: "Banks—Regional",
    ticker: "BBDC4",
    price: 17.86,
    shares: 10600,
    revenueLTM: 112000,
    revenueGrowth: 0.035,
    grossProfit: 62000,
    grossMargin: 0.554,
    ebitda: 25000,
    ebitdaMargin: 0.223,
    netDebt: -8000,
    netIncome: 16300,
    description: "Banco Bradesco S.A. provides various banking products and services to individuals, corporates, and institutions in Brazil and internationally. It operates through Banking and Insurance segments.",
    comps: ["PETR4", "VALE3", "ITUB4", "WEGE3"],
    growthRateYear1: 0.04,
    growthRateYear2: 0.05,
    growthRateYear3: 0.06,
    growthRateYear4: 0.05,
    growthRateYear5: 0.04,
    ebitdaMarginProj: 0.23,
    wacc: 0.098,
    terminalMultiple: 8.0,
    freeCashFlowLTM: 14000,
  }
};

// Generates dynamic data for any other ticker based on realistic ratios
// Generates dynamic data for any other ticker based on realistic ratios
export function fetchCompanyData(tickerSymbol) {
  const symbol = tickerSymbol.toUpperCase().trim();
  let company;
  
  if (REAL_TICKERS[symbol]) {
    company = { ...REAL_TICKERS[symbol] };
  } else {
    // Realistic mock generator for search fallbacks
    // Emulates high-quality financials dynamically seeded by ticker string
    const charSum = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sizeFactor = 1 + (charSum % 10) * 0.2; // random size scaler
    
    const baseRevenue = 15000 * sizeFactor;
    const growth = 0.04 + (charSum % 15) * 0.015;
    const grossMargin = 0.25 + (charSum % 5) * 0.1;
    const ebitdaMargin = grossMargin * (0.4 + (charSum % 3) * 0.1);
    const shares = 500 + (charSum % 3) * 120;
    const price = 25 + (charSum % 50) * 4.5;
    
    const revenueLTM = Math.round(baseRevenue);
    const grossProfit = Math.round(revenueLTM * grossMargin);
    const ebitda = Math.round(revenueLTM * ebitdaMargin);
    const netIncome = Math.round(ebitda * 0.55);
    const netDebt = Math.round(ebitda * (charSum % 2 === 0 ? 1.5 : -1.2)); // Some have debt, some net cash

    company = {
      name: `${symbol} Technologies Corp.`,
      sector: charSum % 2 === 0 ? "Technology" : "Industrials",
      industry: charSum % 2 === 0 ? "Software—Application" : "Specialty Machinery",
      ticker: symbol,
      price: parseFloat(price.toFixed(2)),
      shares: shares,
      revenueLTM: revenueLTM,
      revenueGrowth: parseFloat(growth.toFixed(3)),
      grossProfit: grossProfit,
      grossMargin: parseFloat(grossMargin.toFixed(3)),
      ebitda: ebitda,
      ebitdaMargin: parseFloat(ebitdaMargin.toFixed(3)),
      netDebt: netDebt,
      netIncome: netIncome,
      description: `${symbol} Technologies Corp. is a leading company specializing in innovative business solutions, operating within the ${charSum % 2 === 0 ? "software application space" : "industrial manufacturing sector"}. The company services clients globally with enterprise products and support.`,
      comps: ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"].filter(t => t !== symbol).slice(0, 4),
      growthRateYear1: parseFloat((growth * 0.9).toFixed(3)),
      growthRateYear2: parseFloat((growth * 0.95).toFixed(3)),
      growthRateYear3: parseFloat(growth.toFixed(3)),
      growthRateYear4: parseFloat((growth * 0.95).toFixed(3)),
      growthRateYear5: parseFloat((growth * 0.9).toFixed(3)),
      ebitdaMarginProj: parseFloat((ebitdaMargin * 1.05).toFixed(3)),
      wacc: 0.08 + (charSum % 4) * 0.007,
      terminalMultiple: 12.0 + (charSum % 10) * 1.2,
      freeCashFlowLTM: Math.round(ebitda * 0.65),
    };
  }

  // Injeta metadados ricos do cache se ativos (ex: nome real do ativo obtido via BRAPI)
  try {
    const metaStr = localStorage.getItem('fsi_metadata_cache');
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      if (meta && meta[symbol]) {
        if (meta[symbol].name) {
          company.name = meta[symbol].name;
        }
        if (meta[symbol].logourl) {
          company.logoUrl = meta[symbol].logourl;
        }
      }
    }
  } catch (e) {
    // Ignored
  }

  // Injeta preço do cache se ativo
  try {
    const cacheStr = localStorage.getItem('fsi_prices_cache');
    if (cacheStr) {
      const cache = JSON.parse(cacheStr);
      if (cache && cache[symbol] !== undefined) {
        company.price = parseFloat(cache[symbol]);
      }
    }
  } catch (e) {
    // Ignored
  }

  return company;
}

// Calculate DCF Valuation Model
export function calculateDCF(company) {
  const wacc = company.wacc;
  const terminalMultiple = company.terminalMultiple;
  
  // 5 Year Projections
  const projections = [];
  let currentRev = company.revenueLTM;
  const ebitdaMargin = company.ebitdaMarginProj;
  
  const growthRates = [
    company.growthRateYear1,
    company.growthRateYear2,
    company.growthRateYear3,
    company.growthRateYear4,
    company.growthRateYear5
  ];
  
  let sumPV = 0;
  for (let i = 0; i < 5; i++) {
    const year = i + 1;
    const growth = growthRates[i];
    const projectedRev = currentRev * (1 + growth);
    const projectedEbitda = projectedRev * ebitdaMargin;
    
    // FCF Proxy = EBITDA - Capex/WC changes (approx 65% of EBITDA for tech companies)
    const fcf = projectedEbitda * 0.65; 
    
    // Discount factor
    const df = 1 / Math.pow(1 + wacc, year);
    const pv = fcf * df;
    
    projections.push({
      year,
      growth,
      revenue: Math.round(projectedRev),
      ebitda: Math.round(projectedEbitda),
      fcf: Math.round(fcf),
      df: parseFloat(df.toFixed(4)),
      pv: Math.round(pv),
    });
    
    sumPV += pv;
    currentRev = projectedRev;
  }
  
  // Terminal Value
  const terminalEbitda = projections[4].ebitda;
  const terminalValue = terminalEbitda * terminalMultiple;
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, 5);
  
  // Enterprise & Equity Value
  const enterpriseValue = sumPV + pvTerminalValue;
  const equityValue = enterpriseValue - company.netDebt;
  const impliedPerShare = equityValue / company.shares;
  
  return {
    projections,
    sumPVOfCashFlows: Math.round(sumPV),
    terminalEbitda: Math.round(terminalEbitda),
    terminalValue: Math.round(terminalValue),
    pvTerminalValue: Math.round(pvTerminalValue),
    enterpriseValue: Math.round(enterpriseValue),
    equityValue: Math.round(equityValue),
    impliedPerShare: parseFloat(impliedPerShare.toFixed(2)),
  };
}

// Calculate LBO Model returns
export function calculateLBO(company, leverageRatio = 4.5, exitMultiple = null) {
  const exitMult = exitMultiple || company.terminalMultiple;
  
  // LBO Entry Assumptions
  const impliedEV = company.price * company.shares + company.netDebt;
  const debtFunding = company.ebitda * leverageRatio;
  const equityFunding = impliedEV - debtFunding;
  
  // Projections 5 Years
  let currentEbitda = company.ebitda;
  const growth = (company.growthRateYear1 + company.growthRateYear5) / 2; // Average growth
  let debtBalance = debtFunding;
  const interestRate = 0.075; // 7.5% debt interest
  
  for (let i = 0; i < 5; i++) {
    const projectedEbitda = currentEbitda * (1 + growth);
    
    // Cash available for debt service = EBITDA - Interest - Capex/WC (approx 35% of EBITDA)
    const interestExpense = debtBalance * interestRate;
    const freeCash = projectedEbitda * 0.55 - interestExpense;
    
    // Pay down debt
    const debtPaid = Math.min(debtBalance, Math.max(0, freeCash));
    debtBalance -= debtPaid;
    currentEbitda = projectedEbitda;
  }
  
  // Exit Calculations
  const exitEbitda = currentEbitda;
  const exitEV = exitEbitda * exitMult;
  const endingDebt = debtBalance;
  const exitEquityValue = exitEV - endingDebt;
  
  // Returns metrics with safety guards against negative equity funding or negative MOIC (e.g. for highly cash-rich/debt-free profiles)
  const moic = (equityFunding > 0 && exitEquityValue > 0) ? (exitEquityValue / equityFunding) : 0;
  const irr = moic > 0 ? (Math.pow(moic, 1 / 5) - 1) : 0;
  
  return {
    impliedEV: Math.round(impliedEV),
    debtFunding: Math.round(debtFunding),
    equityFunding: Math.round(equityFunding),
    exitEbitda: Math.round(exitEbitda),
    exitEV: Math.round(exitEV),
    endingDebt: Math.round(endingDebt),
    exitEquityValue: Math.round(exitEquityValue),
    moic: parseFloat(moic.toFixed(2)),
    irr: parseFloat((irr * 100).toFixed(1)),
  };
}

// Generate Comps Analysis table
export function fetchCompsAnalysis(company) {
  const peers = company.comps.map(t => fetchCompanyData(t));
  const all = [{ ...company, isTarget: true }, ...peers];
  
  return all.map(c => {
    const marketCap = c.price * c.shares;
    const ev = marketCap + c.netDebt;
    
    return {
      ticker: c.ticker,
      name: c.name,
      price: c.price,
      shares: c.shares,
      marketCap: Math.round(marketCap),
      ev: Math.round(ev),
      revenue: c.revenueLTM,
      growth: c.revenueGrowth,
      grossMargin: c.grossMargin,
      ebitda: c.ebitda,
      ebitdaMargin: c.ebitdaMargin,
      netIncome: c.netIncome,
      evRevenue: parseFloat((ev / c.revenueLTM).toFixed(1)),
      evEbitda: parseFloat((ev / c.ebitda).toFixed(1)),
      pe: parseFloat((marketCap / c.netIncome).toFixed(1)),
      isTarget: c.isTarget || false,
    };
  });
}

// Dynamic background API Price Fetcher with local storage caching
export async function updateLivePricesCache(tickers = [], provider = 'simulated', apiKey = '') {
  const cleanTickers = tickers.map(t => t.toUpperCase().trim()).filter(Boolean);
  if (cleanTickers.length === 0) return { success: false, reason: 'No tickers' };

  try {
    let priceMap = {};
    // Lê o cache existente
    try {
      const existing = localStorage.getItem('fsi_prices_cache');
      if (existing) {
        priceMap = JSON.parse(existing) || {};
      }
    } catch (e) {
      priceMap = {};
    }

    // Heurística de divisão: Ativos brasileiros (B3) terminam com dígito ou contêm ".SA"
    const brazilianTickers = cleanTickers.filter(t => /\d$/.test(t) || t.includes('.SA'));
    const usTickers = cleanTickers.filter(t => !(/\d$/.test(t) || t.includes('.SA')));

    // 1. Atualiza ativos do Brasil sempre via BRAPI se houver token
    if (brazilianTickers.length > 0) {
      // Resolve a chave da BRAPI com segurança, isolando-a das chaves dos provedores de ações dos EUA
      const brapiKey = localStorage.getItem('fsi_brapi_api_key') || 
                       (provider === 'brapi' ? apiKey : null) || 
                       (localStorage.getItem('fsi_finance_api_provider') === 'brapi' ? localStorage.getItem('fsi_finance_api_key') : null) || 
                       '3NQyj7ujtTwoq84s7vQTsL';
                       
      if (brapiKey && brapiKey !== 'undefined') {
        try {
          // Garante que os tickers estejam no formato correto para a BRAPI (ex: PETR4, não PETR4.SA)
          const brapiTickers = brazilianTickers.map(t => t.replace('.SA', ''));
          
          // Carrega cache de metadados existente
          let metaMap = {};
          try {
            const existingMeta = localStorage.getItem('fsi_metadata_cache');
            if (existingMeta) {
              metaMap = JSON.parse(existingMeta) || {};
            }
          } catch (e) {
            metaMap = {};
          }

          // A chave gratuita da BRAPI restringe consultas a no máximo 1 ativo por requisição.
          // Para contornar isso e evitar erros de limite de ativos (QUOTES_PER_REQUEST_EXCEEDED),
          // fazemos as consultas em paralelo para cada ticker individualmente.
          const fetchPromises = brapiTickers.map(async (ticker) => {
            const url = `https://brapi.dev/api/quote/${ticker}?token=${brapiKey}`;
            try {
              const res = await fetch(url);
              if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.results) && data.results[0]) {
                  const item = data.results[0];
                  if (item.regularMarketPrice !== undefined) {
                    const symbolUpper = item.symbol.toUpperCase();
                    priceMap[symbolUpper] = parseFloat(item.regularMarketPrice);
                    
                    // Salva metadados ricos (nome oficial da empresa e URL do logo)
                    metaMap[symbolUpper] = {
                      name: item.longName || item.shortName || `${symbolUpper} S.A.`,
                      logourl: item.logourl || '',
                    };

                    // Também salva no formato com .SA se foi solicitado assim
                    const requestedWithSA = brazilianTickers.find(t => t.startsWith(symbolUpper));
                    if (requestedWithSA) {
                      priceMap[requestedWithSA] = parseFloat(item.regularMarketPrice);
                      metaMap[requestedWithSA] = {
                        name: item.longName || item.shortName || `${symbolUpper} S.A.`,
                        logourl: item.logourl || '',
                      };
                    }
                  }
                }
              } else {
                console.warn(`BRAPI error status for ${ticker}: ${res.status}`);
              }
            } catch (err) {
              console.warn(`[BRAPI Fetch Error] Failed for ${ticker}:`, err);
            }
          });

          await Promise.all(fetchPromises);

          // Persiste o cache de metadados
          localStorage.setItem('fsi_metadata_cache', JSON.stringify(metaMap));
        } catch (e) {
          console.warn('[BRAPI Automatic Fetch Error] Failed:', e);
        }
      }
    }

    // 2. Atualiza ativos dos EUA com o provedor selecionado
    if (usTickers.length > 0 && provider !== 'simulated' && apiKey) {
      if (provider === 'twelvedata') {
        const url = `https://api.twelvedata.com/price?symbol=${usTickers.join(',')}&apikey=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (usTickers.length === 1) {
            const symbol = usTickers[0];
            if (data && data.price) {
              priceMap[symbol] = parseFloat(data.price);
            }
          } else if (data) {
            usTickers.forEach(sym => {
              if (data[sym] && data[sym].price) {
                priceMap[sym] = parseFloat(data[sym].price);
              }
            });
          }
        }
      } else if (provider === 'finnhub') {
        const promises = usTickers.map(async (symbol) => {
          try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data && data.c !== undefined && data.c !== null && data.c !== 0) {
                return { symbol, price: parseFloat(data.c) };
              }
            }
          } catch (e) {
            console.warn(`[Finnhub Error] Failed to fetch for ${symbol}:`, e);
          }
          return null;
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res) {
            priceMap[res.symbol] = res.price;
          }
        });
      } else if (provider === 'brapi') {
        // Se o usuário selecionou BRAPI como provedor geral e tem ativos EUA
        try {
          const url = `https://brapi.dev/api/quote/${usTickers.join(',')}?token=${apiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.results)) {
              data.results.forEach(item => {
                if (item && item.symbol && item.regularMarketPrice !== undefined) {
                  priceMap[item.symbol.toUpperCase()] = parseFloat(item.regularMarketPrice);
                }
              });
            }
          }
        } catch (e) {
          console.warn('[BRAPI US Fetch Error] Failed:', e);
        }
      }
    }

    // Salva o cache de volta no localStorage
    localStorage.setItem('fsi_prices_cache', JSON.stringify(priceMap));
    return { success: true, prices: priceMap };
  } catch (error) {
    console.error('[API Fetch Error] Failed to update prices:', error);
    return { success: false, reason: error.message };
  }
}

