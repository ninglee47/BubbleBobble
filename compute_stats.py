import json
import math
import yfinance as yf
import pandas as pd
import numpy as np

def compute_stats_for_symbol(symbol):
    print(f"\n--- Processing {symbol} ---")
    # Fetch at least 100 days of data to ensure we get 60 trading days
    df = yf.download(symbol, period="6mo", progress=False)
    
    if df.empty or len(df) < 60:
        print(f"Not enough data for {symbol}")
        return
    
    # Take the last 60 trading days
    df = df.tail(60)
    
    # Extract Series from multi-index columns if necessary
    close_prices = df['Close'].values.flatten()
    high_prices = df['High'].values.flatten()
    
    lookback = 60
    holding_time = 20
    
    avg_price = np.mean(close_prices)
    # Pandas/Numpy std with ddof=1 for sample standard deviation (TradingView stdev uses sample)
    vol_std = np.std(close_prices, ddof=1)
    min_price = np.min(close_prices)
    
    p25 = np.percentile(close_prices, 25, method='linear')
    median = np.percentile(close_prices, 50, method='linear')
    p75 = np.percentile(close_prices, 75, method='linear')
    
    num_sections = math.floor(lookback / holding_time)
    sum_max = 0.0
    
    for i in range(num_sections):
        start_idx = i * holding_time
        end_idx = start_idx + holding_time
        section_highs = high_prices[start_idx:end_idx]
        section_max = np.max(section_highs)
        sum_max += section_max
        
    e_max = sum_max / num_sections if num_sections > 0 else np.nan
    
    tp_line = (e_max + avg_price) / 2.0
    sl_line = avg_price - (1.645 * vol_std) / math.sqrt(lookback)
    
    current_price = close_prices[-1]
    
    print(f"Current Price: {current_price:.2f}")
    print(f"Avg Price:     {avg_price:.2f}")
    print(f"Vol Std:       {vol_std:.2f}")
    print(f"Min Price:     {min_price:.2f}")
    print(f"P25:           {p25:.2f}")
    print(f"Median:        {median:.2f}")
    print(f"P75:           {p75:.2f}")
    print(f"E[max]:        {e_max:.2f}")
    print(f"TP Line:       {tp_line:.2f}")
    print(f"SL Line:       {sl_line:.2f}")

def main():
    try:
        with open('data/capex.json', 'r') as f:
            data = json.load(f)
        symbols = list(data.get('allHistory', {}).keys())
    except Exception as e:
        print("Could not read capex.json:", e)
        symbols = ['MSFT', 'AMZN', 'META', 'GOOGL']
        
    print(f"Symbols to process: {symbols}")
    
    for sym in symbols:
        compute_stats_for_symbol(sym)

if __name__ == "__main__":
    main()
