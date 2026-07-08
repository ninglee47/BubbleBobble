const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const msft = await yahooFinance.fundamentalsTimeSeries('MSFT', {
      period1: '2024-01-01',
      module: 'all',
      type: 'quarterlyCapitalExpenditure'
    });
    console.log("MSFT fundamentals:", msft.slice(-2));
  } catch (err) {
    console.error(err);
  }
}

test();
