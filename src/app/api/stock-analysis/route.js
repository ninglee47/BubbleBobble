import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const yahooFinance = new YahooFinance();

// Helper function to calculate percentiles
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  if (typeof p !== 'number') throw new TypeError('p must be a number');
  if (p <= 0) return arr[0];
  if (p >= 100) return arr[arr.length - 1];
  
  const index = (arr.length - 1) * p / 100;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;
  
  if (upper >= arr.length) return arr[lower];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  const dataDir = path.join(process.cwd(), 'data');
  const listFile = path.join(process.cwd(), 'list.local');
  const capexFile = path.join(dataDir, 'capex.json');
  let symbols = ['MSFT', 'AMZN', 'META', 'GOOGL'];
  
  try {
    const listContent = await fs.readFile(listFile, 'utf-8');
    const lines = listContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      symbols = lines;
    } else {
      throw new Error("list.local is empty");
    }
  } catch (err) {
    try {
      const fileContent = await fs.readFile(capexFile, 'utf-8');
      const data = JSON.parse(fileContent);
      if (data && data.allHistory) {
        symbols = Object.keys(data.allHistory);
      }
    } catch (err2) {
      console.warn("Could not read list.local or capex.json, using default symbols.");
    }
  }

  const results = [];

  for (const symbol of symbols) {
    try {
      // Fetch ~6 months of daily data to ensure we have at least 60 trading days
      const oneYearAgo = new Date();
      oneYearAgo.setMonth(oneYearAgo.getMonth() - 6);
      
      const queryOptions = { period1: oneYearAgo.toISOString().split('T')[0] };
      const chartResult = await yahooFinance.chart(symbol, queryOptions);
      
      const history = (chartResult && chartResult.quotes) ? chartResult.quotes.filter(q => q.close !== null) : [];
      
      if (history.length < 60) {
        console.warn(`Not enough data for ${symbol}. Found ${history.length} rows.`);
        continue;
      }
      
      // Keep only the last 60 rows
      const last60 = history.slice(-60);
      
      const closePrices = last60.map(d => d.close);
      const highPrices = last60.map(d => d.high);
      
      const lookback = 60;
      const holding_time = 20;
      
      const sum_close = closePrices.reduce((a, b) => a + b, 0);
      const avg_price = sum_close / lookback;
      
      // Standard deviation (sample ddof=1)
      const variance = closePrices.reduce((a, b) => a + Math.pow(b - avg_price, 2), 0) / (lookback - 1);
      const vol_std = Math.sqrt(variance);
      
      const min_price = Math.min(...closePrices);
      
      // Sorted close prices for percentiles
      const sortedClose = [...closePrices].sort((a, b) => a - b);
      const p25 = percentile(sortedClose, 25);
      const median = percentile(sortedClose, 50);
      const p75 = percentile(sortedClose, 75);
      
      const num_sections = Math.floor(lookback / holding_time);
      let sum_max = 0.0;
      
      for (let i = 0; i < num_sections; i++) {
        let section_max = highPrices[i * holding_time];
        for (let j = 0; j < holding_time; j++) {
          const idx = (i * holding_time) + j;
          if (highPrices[idx] > section_max) {
            section_max = highPrices[idx];
          }
        }
        sum_max += section_max;
      }
      
      const e_max = num_sections > 0 ? (sum_max / num_sections) : null;
      
      const tp_line = e_max ? (e_max + avg_price) / 2.0 : null;
      const sl_line = avg_price - (1.645 * vol_std) / Math.sqrt(lookback);
      
      const current_price = closePrices[closePrices.length - 1];

      let aiAnalysis = null;
      
      if (apiKey) {
        try {
           const genAI = new GoogleGenerativeAI(apiKey);
           // Using gemini-2.5-flash for speed
           const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
           
           const prompt = `
             You are a quantitative trading assistant. Analyze the following statistics for ${symbol}.
             Current Price: ${current_price.toFixed(2)}
             Take Profit Line: ${tp_line ? tp_line.toFixed(2) : 'N/A'}
             Stop Loss Line: ${sl_line.toFixed(2)}
             Average Price: ${avg_price.toFixed(2)}
             
             Please answer these exactly in a JSON object format with the following keys:
             "position": (tell me what's the position of current price consider the take profit and stop loss line)
             "action": (buy, sell or wait - strictly one of these words capitalized)
             "targets": (if I buy where is the take profit and stop loss)
             "description": (describe the stock by one sentence)
             
             Respond ONLY with valid JSON.
           `;
           
           const result = await model.generateContent(prompt);
           const responseText = result.response.text();
           // Attempt to parse json out of the markdown response
           const jsonStrMatch = responseText.match(/\{[\s\S]*\}/);
           if (jsonStrMatch) {
               aiAnalysis = JSON.parse(jsonStrMatch[0]);
           }
        } catch (aiErr) {
           console.error(`Gemini API Error for ${symbol}:`, aiErr);
           aiAnalysis = { error: "Failed to fetch AI analysis." };
        }
      } else {
        aiAnalysis = { error: "GEMINI_API_KEY is not set." };
      }

      results.push({
        symbol,
        current_price: parseFloat(current_price.toFixed(2)),
        avg_price: parseFloat(avg_price.toFixed(2)),
        tp_line: tp_line ? parseFloat(tp_line.toFixed(2)) : null,
        sl_line: parseFloat(sl_line.toFixed(2)),
        p25: parseFloat(p25.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        p75: parseFloat(p75.toFixed(2)),
        e_max: e_max ? parseFloat(e_max.toFixed(2)) : null,
        min_price: parseFloat(min_price.toFixed(2)),
        analysis: aiAnalysis
      });

    } catch (e) {
      console.error(`Error processing ${symbol}:`, e);
    }
  }

  return NextResponse.json({ data: results });
}
