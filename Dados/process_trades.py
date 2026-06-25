import os
import re
import csv
import json
import urllib.request
from datetime import datetime, timedelta

# Configuration
WORKSPACE_DIR = "/Users/ronaldo.ribeirocastellano/Github/FinancialMarket/Dados"
AVENUE_HISTORIC_PATH = os.path.join(WORKSPACE_DIR, "Avenue US - 2023 a 2025.csv")
AVENUE_CURRENT_PATH = os.path.join(WORKSPACE_DIR, "Avenue US - 2026-01 a 2026-06-09.csv")
TASTYTRADE_PATH = os.path.join(WORKSPACE_DIR, "tastytrade_transactions_260101_to_260609.csv")
RATES_CACHE_FILE = os.path.join(WORKSPACE_DIR, "usd_brl_rates.json")
REPORT_CSV_PATH = os.path.join(WORKSPACE_DIR, "detailed_report.csv")
REPORT_MD_PATH = os.path.join(WORKSPACE_DIR, "detailed_report.md")

# Ticker mapping (FISV -> FI)
TICKER_MAPPING = {
    'FISV': 'FI'
}

# Splits definitions
# Format: (date, multiplier_qty, multiplier_price)
# For a 10-for-1 split: qty is multiplied by 10, price is divided by 10 (so multiplier_qty = 10, multiplier_price = 0.1)
# For a 1-for-5 reverse split: qty is multiplied by 0.2, price is multiplied by 5 (so multiplier_qty = 0.2, multiplier_price = 5)
STOCK_SPLITS = {
    'NVDA': [('2024-06-07', 10.0, 0.1)],
    'AVGO': [('2024-07-15', 10.0, 0.1)],
    # Note: YieldMax splits (TSLY, MSTY, CONY) did not occur during holding periods,
    # but we can list them here for completeness if needed.
}

def get_exchange_rates(start_date='01-01-2023', end_date='12-31-2026', cache_file=RATES_CACHE_FILE):
    """
    Downloads historical USD/BRL exchange rates from BCB Olinda API and caches them.
    """
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading rates cache, refetching: {e}")
            
    print("Downloading exchange rates from BCB...")
    url = f"https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='{start_date}'&@dataFinalCotacao='{end_date}'&$top=10000&$format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            rates = {}
            for item in res_data['value']:
                date_part = item['dataHoraCotacao'].split(' ')[0] # YYYY-MM-DD
                rates[date_part] = {
                    'buy': item['cotacaoCompra'],
                    'sell': item['cotacaoVenda']
                }
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(rates, f, indent=4)
            print(f"Successfully cached {len(rates)} exchange rates.")
            return rates
    except Exception as e:
        print(f"Error fetching PTAX rates: {e}")
        # Return fallback empty dict
        return {}

def get_ptax_rate(rates, date_str, rate_type='buy'):
    """
    Gets the exchange rate for a given date. If the date has no rate (e.g. weekend),
    walks backwards to find the nearest business day with a rate.
    """
    if not rates:
        return 5.0 # default fallback
    
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    for i in range(10):
        check_dt = dt - timedelta(days=i)
        check_str = check_dt.strftime('%Y-%m-%d')
        if check_str in rates:
            return rates[check_str][rate_type]
    return 5.0

def parse_avenue_number(num_str, is_quantity=False, valor_ref=0.0, price_ref=0.0):
    """
    Parses a number from Avenue description, reconstructing decimals if they were stripped.
    """
    num_str = num_str.strip()
    
    # If there is a comma, it has normal decimal separators
    if ',' in num_str:
        clean_str = num_str.replace('.', '').replace(',', '.')
        return float(clean_str)
        
    # If there is no comma, but there is a dot:
    # Under Portuguese format, a dot is a thousands separator.
    # In the 2023-2025 file, commas were stripped. So "1.455" could be "1455".
    # Or "1.74872" could be "1748.72".
    
    # Let's clean the string of all dots to get the raw digits
    digits = num_str.replace('.', '').strip()
    if not digits:
        return 0.0
        
    val_int = int(digits)
    
    if not is_quantity:
        # For price: price is always the raw digits divided by 100 (cents)
        return val_int / 100.0
    else:
        # For quantity: we use the reference transaction value (net cash flow)
        # to find the position of the decimal point that makes Q * Price closest to abs(Valor).
        if price_ref == 0.0:
            # If no price reference is available, assume it's an integer
            return float(val_int)
            
        best_qty = float(val_int)
        min_diff = float('inf')
        for k in range(8):
            candidate = val_int / (10 ** k)
            expected = candidate * price_ref
            diff = abs(expected - abs(valor_ref))
            if diff < min_diff:
                min_diff = diff
                best_qty = candidate
        return best_qty

def parse_avenue_csv(file_path, rates, is_historic=True):
    """
    Parses transactions from Avenue CSV files.
    """
    transactions = []
    if not os.path.exists(file_path):
        print(f"Warning: File {file_path} not found.")
        return transactions

    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 2):
            date_raw = row['Data transação'].strip()
            if not date_raw:
                continue
                
            # Parse Date
            try:
                if '-' in date_raw:
                    dt = datetime.strptime(date_raw, '%Y-%m-%d')
                else:
                    dt = datetime.strptime(date_raw, '%d/%m/%Y')
            except ValueError as e:
                print(f"Error parsing date {date_raw} at line {i} in {file_path}: {e}")
                continue
                
            date_str = dt.strftime('%Y-%m-%d')
            desc = row['Descrição'].strip()
            valor = float(row['Valor'].replace(',', '.')) if row['Valor'] else 0.0
            
            # Map PTAX rates
            ptax_buy = get_ptax_rate(rates, date_str, 'buy')
            ptax_sell = get_ptax_rate(rates, date_str, 'sell')
            
            # Standard variables
            symbol = None
            action = None
            quantity = 0.0
            price = 0.0
            is_option = False
            fees = 0.0
            
            # 1. Parse Stock trades
            # e.g., "Compra de 76 OMF a $ 3946 cada" or "Venda de 39 NVDA a $ 201,68 cada"
            stock_buy = re.match(r"Compra de ([\d\.,\s]+) ([A-Z0-9]+) a \$?\s*([\d\.,\s]+) cada", desc)
            stock_sell = re.match(r"Venda de ([\d\.,\s]+) ([A-Z0-9]+) a \$?\s*([\d\.,\s]+) cada", desc)
            
            # 2. Parse Option trades
            # e.g., "Compra de 5 contratos de PUT de BABA a $ 148 cada"
            opt_buy = re.match(r"Compra de (\d+) contratos? de (CALL|PUT) de ([A-Z0-9]+) a \$?\s*([\d\.,\s]+) cada", desc)
            opt_sell = re.match(r"Venda de (\d+) contratos? de (CALL|PUT) de ([A-Z0-9]+) a \$?\s*([\d\.,\s]+) cada", desc)
            
            if stock_buy:
                q_str, sym, p_str = stock_buy.groups()
                action = 'BUY'
                symbol = TICKER_MAPPING.get(sym, sym)
                price = parse_avenue_number(p_str, is_quantity=False)
                quantity = parse_avenue_number(q_str, is_quantity=True, valor_ref=valor, price_ref=price)
            elif stock_sell:
                q_str, sym, p_str = stock_sell.groups()
                action = 'SELL'
                symbol = TICKER_MAPPING.get(sym, sym)
                price = parse_avenue_number(p_str, is_quantity=False)
                quantity = parse_avenue_number(q_str, is_quantity=True, valor_ref=valor, price_ref=price)
            elif opt_buy:
                qty_str, otype, sym, p_str = opt_buy.groups()
                action = 'BUY'
                is_option = True
                symbol = f"{TICKER_MAPPING.get(sym, sym)}_{otype}"
                price = parse_avenue_number(p_str, is_quantity=False) # Premium price (e.g. 1.48)
                # Option quantity is number of contracts
                quantity = float(qty_str)
            elif opt_sell:
                qty_str, otype, sym, p_str = opt_sell.groups()
                action = 'SELL'
                is_option = True
                symbol = f"{TICKER_MAPPING.get(sym, sym)}_{otype}"
                price = parse_avenue_number(p_str, is_quantity=False)
                quantity = float(qty_str)
                
            # 3. Parse fees
            # e.g., "Cobrança de taxa de corretagem de OMF"
            elif "taxa de corretagem" in desc.lower() or "taxa de corretagem de opções" in desc.lower():
                # We can associate the fee with the ticker
                # Ticker is usually the last word
                words = desc.split()
                sym = words[-1].upper()
                symbol = TICKER_MAPPING.get(sym, sym)
                if "opções" in desc.lower():
                    # Option fees don't list symbol in description, we will map them by date later
                    symbol = "OPTION_FEE"
                    is_option = True
                action = 'FEE'
                fees = abs(valor)
                
            # If it's a trade, add it
            if action in ['BUY', 'SELL']:
                transactions.append({
                    'date': date_str,
                    'time': dt,
                    'broker': 'Avenue',
                    'symbol': symbol,
                    'action': action,
                    'quantity': quantity,
                    'price_usd': price,
                    'total_usd': abs(valor),
                    'fees_usd': 0.0, # Will be filled from separate FEE transactions
                    'is_option': is_option,
                    'ptax_buy': ptax_buy,
                    'ptax_sell': ptax_sell
                })
            elif action == 'FEE':
                transactions.append({
                    'date': date_str,
                    'time': dt,
                    'broker': 'Avenue',
                    'symbol': symbol,
                    'action': 'FEE',
                    'quantity': 0.0,
                    'price_usd': 0.0,
                    'total_usd': 0.0,
                    'fees_usd': fees,
                    'is_option': is_option,
                    'ptax_buy': ptax_buy,
                    'ptax_sell': ptax_sell
                })
                
    # Allocate fees to trades on the same date and ticker
    # For option fees, we allocate them to options traded on the same day
    trades = [t for t in transactions if t['action'] in ['BUY', 'SELL']]
    fees_list = [t for t in transactions if t['action'] == 'FEE']
    
    for fee in fees_list:
        date = fee['date']
        symbol = fee['symbol']
        
        if symbol == "OPTION_FEE":
            # Match option trades on same day
            matching_trades = [t for t in trades if t['date'] == date and t['is_option']]
            if matching_trades:
                # Distribute fee equally or to the first one
                matching_trades[0]['fees_usd'] += fee['fees_usd']
        else:
            # Match stock trades on same day and symbol
            matching_trades = [t for t in trades if t['date'] == date and t['symbol'] == symbol]
            if matching_trades:
                matching_trades[0]['fees_usd'] += fee['fees_usd']
                
    return trades

def parse_tastytrade_csv(file_path, rates):
    """
    Parses transactions from Tastytrade CSV file.
    """
    transactions = []
    if not os.path.exists(file_path):
        print(f"Warning: File {file_path} not found.")
        return transactions

    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 2):
            date_raw = row['Date'].strip()
            if not date_raw:
                continue
                
            # Parse Date/Time (Tastytrade uses ISO 8601)
            # e.g., '2026-06-05T10:30:03-0300'
            try:
                if 'T' in date_raw:
                    date_part, time_part = date_raw.split('T')
                    clean_time = time_part[:8]
                    dt = datetime.strptime(f"{date_part} {clean_time}", '%Y-%m-%d %H:%M:%S')
                else:
                    dt = datetime.strptime(date_raw, '%Y-%m-%d')
            except ValueError as e:
                print(f"Error parsing Tastytrade date {date_raw} at line {i}: {e}")
                continue
                
            date_str = dt.strftime('%Y-%m-%d')
            ptax_buy = get_ptax_rate(rates, date_str, 'buy')
            ptax_sell = get_ptax_rate(rates, date_str, 'sell')
            
            trans_type = row['Type'].strip()
            sub_type = row['Sub Type'].strip()
            action_raw = row['Action'].strip()
            symbol = row['Symbol'].strip()
            inst_type = row['Instrument Type'].strip()
            
            # We only process trades or option expirations
            is_trade = (trans_type == 'Trade')
            is_expiration = (trans_type == 'Receive Deliver' and sub_type == 'Expiration')
            
            if not (is_trade or is_expiration):
                continue
                
            is_option = (inst_type == 'Equity Option')
            
            # Map actions
            # BUY_TO_OPEN / BUY_TO_CLOSE / SELL_TO_OPEN / SELL_TO_CLOSE
            action = None
            if 'BUY' in action_raw:
                action = 'BUY'
            elif 'SELL' in action_raw:
                action = 'SELL'
                
            if not action:
                continue
                
            # Quantity
            quantity = float(row['Quantity'].replace(',', '')) if row['Quantity'] else 0.0
            
            # Average Price
            # Tastytrade prices are stored as strings with commas
            avg_price_str = row['Average Price'].replace(',', '').strip()
            price = float(avg_price_str) if avg_price_str else 0.0
            price = abs(price)
            
            # Value & Fees
            total_str = row['Total'].replace(',', '').strip()
            total = float(total_str) if total_str else 0.0
            
            commissions = float(row['Commissions'].replace(',', '').replace('--', '0').strip()) if row['Commissions'] else 0.0
            fees = float(row['Fees'].replace(',', '').replace('--', '0').strip()) if row['Fees'] else 0.0
            total_fees = abs(commissions) + abs(fees)
            
            # If option expiration, price is 0
            if is_expiration:
                price = 0.0
                total = 0.0
                total_fees = 0.0
                
            # Normalize Option symbol for readability
            # e.g., 'SPXW  260513P07415000' -> we can split to underlying + type
            if is_option:
                opt_type = row['Call or Put'].strip()
                underlying = row['Underlying Symbol'].strip()
                symbol = f"{underlying}_{opt_type}"
                
            transactions.append({
                'date': date_str,
                'time': dt,
                'broker': 'Tastytrade',
                'symbol': TICKER_MAPPING.get(symbol, symbol),
                'action': action,
                'quantity': quantity,
                'price_usd': price,
                'total_usd': abs(total),
                'fees_usd': total_fees,
                'is_option': is_option,
                'ptax_buy': ptax_buy,
                'ptax_sell': ptax_sell
            })
            
    return transactions

def apply_stock_splits(trades):
    """
    Applies historical stock splits to the trades list.
    """
    # Sort trades chronologically to apply splits correctly
    trades = sorted(trades, key=lambda t: (t['date'], t['time']))
    
    for symbol, splits in STOCK_SPLITS.items():
        for split_date, mult_qty, mult_price in splits:
            split_dt = datetime.strptime(split_date, '%Y-%m-%d')
            # For each trade of this symbol BEFORE the split date:
            # We multiply its quantity by mult_qty, and divide its price by mult_qty
            for t in trades:
                if t['symbol'] == symbol:
                    trade_dt = datetime.strptime(t['date'], '%Y-%m-%d')
                    if trade_dt <= split_dt:
                        t['quantity'] *= mult_qty
                        t['price_usd'] *= mult_price
                        
    return trades

def process_day_trades(trades):
    """
    Identifies day trades (same day buy & sell) and separates them from swing trades.
    Returns: (day_trades_runs, remaining_swing_trades)
    """
    # Group trades by date and symbol
    grouped = {}
    for t in trades:
        key = (t['date'], t['symbol'])
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(t)
        
    day_trades_runs = []
    remaining_swing_trades = []
    
    for (date, symbol), day_list in grouped.items():
        buys = [t for t in day_list if t['action'] == 'BUY']
        sells = [t for t in day_list if t['action'] == 'SELL']
        
        if buys and sells:
            # Day trade occurred!
            total_buy_qty = sum(b['quantity'] for b in buys)
            total_sell_qty = sum(s['quantity'] for s in sells)
            dt_qty = min(total_buy_qty, total_sell_qty)
            
            # Match FIFO within the day
            buy_idx = 0
            sell_idx = 0
            
            matched_qty = 0.0
            
            # Temporary mutable copies
            temp_buys = [{**b} for b in buys]
            temp_sells = [{**s} for s in sells]
            
            while buy_idx < len(temp_buys) and sell_idx < len(temp_sells) and matched_qty < dt_qty:
                b = temp_buys[buy_idx]
                s = temp_sells[sell_idx]
                
                if b['quantity'] == 0:
                    buy_idx += 1
                    continue
                if s['quantity'] == 0:
                    sell_idx += 1
                    continue
                    
                match_q = min(b['quantity'], s['quantity'])
                
                # Pro-rate fees
                b_fees = (match_q / buys[buy_idx]['quantity']) * buys[buy_idx]['fees_usd']
                s_fees = (match_q / sells[sell_idx]['quantity']) * sells[sell_idx]['fees_usd']
                
                # Create a day trade run
                day_trades_runs.append({
                    'date': date,
                    'symbol': symbol,
                    'quantity': match_q,
                    'buy_price': b['price_usd'],
                    'sell_price': s['price_usd'],
                    'buy_fees': b_fees,
                    'sell_fees': s_fees,
                    'is_option': b['is_option'],
                    'ptax_buy': b['ptax_buy'],
                    'ptax_sell': s['ptax_sell']
                })
                
                # Update quantities
                b['quantity'] -= match_q
                s['quantity'] -= match_q
                matched_qty += match_q
                
            # Append remaining quantities as swing trades
            for b in temp_buys:
                if b['quantity'] > 0.00001:
                    remaining_swing_trades.append(b)
            for s in temp_sells:
                if s['quantity'] > 0.00001:
                    remaining_swing_trades.append(s)
        else:
            # No day trade, all are swing trades
            remaining_swing_trades.extend(day_list)
            
    return day_trades_runs, remaining_swing_trades

def process_swing_trades(trades):
    """
    Calculates average price and gain/loss for swing trades.
    Returns: list of closed sales details
    """
    # Sort chronologically
    trades = sorted(trades, key=lambda t: (t['date'], t['time']))
    
    positions = {} # symbol -> { 'qty': float, 'avg_price': float }
    lots = {} # symbol -> list of {'date': str, 'qty': float}
    closed_runs = []
    
    for t in trades:
        symbol = t['symbol']
        action = t['action']
        qty = t['quantity']
        price = t['price_usd']
        fees = t['fees_usd']
        date = t['date']
        
        if symbol not in positions:
            positions[symbol] = {
                'qty': 0.0,
                'avg_price': 0.0
            }
            lots[symbol] = []
            
        pos = positions[symbol]
        sym_lots = lots[symbol]
        
        if pos['qty'] == 0.0:
            # Open position (can be long or short)
            pos['qty'] = qty if action == 'BUY' else -qty
            if action == 'BUY':
                pos['avg_price'] = (qty * price + fees) / qty
            else:
                pos['avg_price'] = (qty * price - fees) / qty
            sym_lots.append({'date': date, 'qty': qty})
        else:
            is_long = (pos['qty'] > 0.0)
            
            if (is_long and action == 'BUY') or (not is_long and action == 'SELL'):
                # Adding to position
                prev_qty_abs = abs(pos['qty'])
                new_qty_abs = prev_qty_abs + qty
                
                if action == 'BUY':
                    cost = qty * price + fees
                else:
                    cost = qty * price - fees
                    
                pos['avg_price'] = (prev_qty_abs * pos['avg_price'] + cost) / new_qty_abs
                pos['qty'] = new_qty_abs if is_long else -new_qty_abs
                sym_lots.append({'date': date, 'qty': qty})
            else:
                # Closing/reducing position
                prev_qty_abs = abs(pos['qty'])
                close_qty = min(qty, prev_qty_abs)
                
                # Pro-rate fees of this transaction for the closed part
                t_fees = (close_qty / qty) * fees
                
                # FIFO lot matching to calculate days held
                total_days = 0.0
                qty_to_match = close_qty
                
                sell_dt = datetime.strptime(date, '%Y-%m-%d')
                
                while qty_to_match > 0.00001 and sym_lots:
                    lot = sym_lots[0]
                    match_q = min(qty_to_match, lot['qty'])
                    
                    buy_dt = datetime.strptime(lot['date'], '%Y-%m-%d')
                    days_diff = abs((sell_dt - buy_dt).days)
                    
                    total_days += match_q * days_diff
                    qty_to_match -= match_q
                    
                    lot['qty'] -= match_q
                    if lot['qty'] < 0.00001:
                        sym_lots.pop(0)
                        
                avg_days = total_days / close_qty if close_qty > 0 else 0.0
                
                if is_long:
                    # Closing a Long position
                    net_proceeds = close_qty * price - t_fees
                    cost_basis = close_qty * pos['avg_price']
                    profit = net_proceeds - cost_basis
                    
                    closed_runs.append({
                        'date': date,
                        'symbol': symbol,
                        'quantity': close_qty,
                        'buy_price': pos['avg_price'],
                        'sell_price': price,
                        'buy_fees': 0.0,
                        'sell_fees': t_fees,
                        'profit_usd': profit,
                        'is_option': t['is_option'],
                        'ptax_buy': t['ptax_buy'],
                        'ptax_sell': t['ptax_sell'],
                        'days_held': avg_days
                    })
                    pos['qty'] -= close_qty
                else:
                    # Closing a Short position
                    cost = close_qty * price + t_fees
                    sale_basis = close_qty * pos['avg_price']
                    profit = sale_basis - cost
                    
                    closed_runs.append({
                        'date': date,
                        'symbol': symbol,
                        'quantity': close_qty,
                        'buy_price': price,
                        'sell_price': pos['avg_price'],
                        'buy_fees': t_fees,
                        'sell_fees': 0.0,
                        'profit_usd': profit,
                        'is_option': t['is_option'],
                        'ptax_buy': t['ptax_buy'],
                        'ptax_sell': t['ptax_sell'],
                        'days_held': avg_days
                    })
                    pos['qty'] += close_qty
                    
                # If there is remaining quantity in this transaction, it opens a position in the opposite direction
                rem_qty = qty - close_qty
                if rem_qty > 0.00001:
                    pos['qty'] = rem_qty if action == 'BUY' else -rem_qty
                    rem_fees = (rem_qty / qty) * fees
                    if action == 'BUY':
                        pos['avg_price'] = (rem_qty * price + rem_fees) / rem_qty
                    else:
                        pos['avg_price'] = (rem_qty * price - rem_fees) / rem_qty
                    sym_lots.append({'date': date, 'qty': rem_qty})
                        
    return closed_runs

def run_main():
    print("Initializing calculation...")
    
    # 1. Load rates
    rates = get_exchange_rates()
    
    # 2. Parse Avenue
    print("Parsing Avenue historic transactions...")
    ave_hist = parse_avenue_csv(AVENUE_HISTORIC_PATH, rates, is_historic=True)
    print(f"Parsed {len(ave_hist)} transactions from historic Avenue file.")
    
    print("Parsing Avenue current transactions...")
    ave_curr = parse_avenue_csv(AVENUE_CURRENT_PATH, rates, is_historic=False)
    print(f"Parsed {len(ave_curr)} transactions from current Avenue file.")
    
    # 3. Parse Tastytrade
    print("Parsing Tastytrade transactions...")
    tasty = parse_tastytrade_csv(TASTYTRADE_PATH, rates)
    print(f"Parsed {len(tasty)} transactions from Tastytrade file.")
    
    # Combine
    all_trades = ave_hist + ave_curr + tasty
    print(f"Total parsed transactions: {len(all_trades)}")
    
    # 4. Apply splits
    all_trades = apply_stock_splits(all_trades)
    
    # 5. Process Day Trades
    day_runs, swing_trades = process_day_trades(all_trades)
    print(f"Identified {len(day_runs)} Day Trade operations.")
    
    # 6. Process Swing Trades
    swing_runs = process_swing_trades(swing_trades)
    print(f"Identified {len(swing_runs)} Swing Trade operations.")
    
    # Combine all closed runs
    # Format each run
    all_runs = []
    
    # Standardize Day Trade runs
    for r in day_runs:
        # Profit in USD = (Sell Price - Buy Price) * Qty - (Buy Fees + Sell Fees)
        profit_usd = (r['sell_price'] - r['buy_price']) * r['quantity'] - (r['buy_fees'] + r['sell_fees'])
        
        # BRL conversion:
        cost_brl = (r['quantity'] * r['buy_price'] + r['buy_fees']) * r['ptax_sell']
        proceeds_brl = (r['quantity'] * r['sell_price'] - r['sell_fees']) * r['ptax_buy']
        profit_brl = proceeds_brl - cost_brl
        
        cost_usd = r['quantity'] * r['buy_price'] + r['buy_fees']
        profit_pct = (profit_usd / cost_usd * 100) if cost_usd > 0 else 0.0
        
        all_runs.append({
            'date': r['date'],
            'symbol': r['symbol'],
            'trade_type': 'Day Trade',
            'quantity': r['quantity'],
            'buy_price': r['buy_price'],
            'sell_price': r['sell_price'],
            'profit_usd': profit_usd,
            'profit_pct': profit_pct,
            'profit_pct_30d': None,
            'profit_brl': profit_brl,
            'cost_usd': cost_usd,
            'cost_brl': cost_brl,
            'proceeds_brl': proceeds_brl,
            'is_option': r['is_option'],
            'days_held': 0.0
        })
        
    # Standardize Swing Trade runs
    for r in swing_runs:
        # BRL conversion:
        cost_brl = (r['quantity'] * r['buy_price'] + r['buy_fees']) * r['ptax_sell']
        proceeds_brl = (r['quantity'] * r['sell_price'] - r['sell_fees']) * r['ptax_buy']
        profit_brl = proceeds_brl - cost_brl
        
        cost_usd = r['quantity'] * r['buy_price'] + r.get('buy_fees', 0.0)
        profit_pct = (r['profit_usd'] / cost_usd * 100) if cost_usd > 0 else 0.0
        
        days_held = r.get('days_held', 0.0)
        profit_pct_30d = (profit_pct * 30.0 / days_held) if days_held > 0 else profit_pct
        
        all_runs.append({
            'date': r['date'],
            'symbol': r['symbol'],
            'trade_type': 'Swing Trade',
            'quantity': r['quantity'],
            'buy_price': r['buy_price'],
            'sell_price': r['sell_price'],
            'profit_usd': r['profit_usd'],
            'profit_pct': profit_pct,
            'profit_pct_30d': profit_pct_30d,
            'profit_brl': profit_brl,
            'cost_usd': cost_usd,
            'cost_brl': cost_brl,
            'proceeds_brl': proceeds_brl,
            'is_option': r['is_option'],
            'days_held': days_held
        })
        
    # Sort all runs chronologically
    all_runs = sorted(all_runs, key=lambda x: x['date'])
    
    # 7. Calculate tax due
    years = ['2023', '2024', '2025', '2026']
    annual_summary = {y: {
        'swing_profit_usd': 0.0,
        'swing_loss_usd': 0.0,
        'day_profit_usd': 0.0,
        'day_loss_usd': 0.0,
        'total_sales_brl': 0.0, # Only for 2023 monthly checks
        'tax_due_brl': 0.0,
        'carry_forward_loss_usd': 0.0,
        'total_cost_usd': 0.0,
        'net_profit_usd': 0.0,
        'return_pct': 0.0
    } for y in years}
    
    # Let's process 2023 monthly
    monthly_sales_2023 = {m: 0.0 for m in range(1, 13)}
    monthly_gains_2023 = {m: 0.0 for m in range(1, 13)}
    
    # Group runs by year and month
    for r in all_runs:
        dt = datetime.strptime(r['date'], '%Y-%m-%d')
        year = str(dt.year)
        month = dt.month
        
        if year not in annual_summary:
            continue
            
        annual_summary[year]['total_cost_usd'] += r['cost_usd']
        annual_summary[year]['net_profit_usd'] += r['profit_usd']
        
        if year == '2023':
            # Add to monthly sales
            # Sales proceeds in BRL
            monthly_sales_2023[month] += r['proceeds_brl']
            # Add to monthly gains (gains can be negative, but GCAP did not allow offsetting losses across different assets in general,
            # though inside the same month/same asset they could be offset. We will offset within the month).
            monthly_gains_2023[month] += r['profit_brl']
        else:
            # 2024-2026 annual rules
            if r['trade_type'] == 'Swing Trade':
                if r['profit_usd'] > 0:
                    annual_summary[year]['swing_profit_usd'] += r['profit_usd']
                else:
                    annual_summary[year]['swing_loss_usd'] += abs(r['profit_usd'])
            else:
                if r['profit_usd'] > 0:
                    annual_summary[year]['day_profit_usd'] += r['profit_usd']
                else:
                    annual_summary[year]['day_loss_usd'] += abs(r['profit_usd'])
                    
    # Calculate 2023 taxes
    for m in range(1, 13):
        sales = monthly_sales_2023[m]
        gain = monthly_gains_2023[m]
        if sales > 35000.0 and gain > 0.0:
            annual_summary['2023']['tax_due_brl'] += gain * 0.15
        # Summary for 2023
        annual_summary['2023']['total_sales_brl'] += sales
        
    # Calculate 2024-2026 taxes with loss carry-forward in USD
    carry_loss = 0.0
    for y in ['2024', '2025', '2026']:
        summ = annual_summary[y]
        total_gain_usd = summ['swing_profit_usd'] + summ['day_profit_usd']
        total_loss_usd = summ['swing_loss_usd'] + summ['day_loss_usd']
        
        net_result_usd = total_gain_usd - total_loss_usd - carry_loss
        
        if net_result_usd > 0.0:
            # Convert to BRL using year-end exchange rate
            # Let's find the rate for the last business day of the year
            if y == '2024':
                rate_date = '2024-12-31'
            elif y == '2025':
                rate_date = '2025-12-31'
            else:
                rate_date = '2026-06-09' # last date of dataset
                
            ptax_buy_end = get_ptax_rate(rates, rate_date, 'buy')
            summ['tax_due_brl'] = net_result_usd * ptax_buy_end * 0.15
            carry_loss = 0.0
        else:
            summ['tax_due_brl'] = 0.0
            carry_loss = abs(net_result_usd)
            summ['carry_forward_loss_usd'] = carry_loss
            
    # Calculate annual return percentages
    for y in years:
        summ = annual_summary[y]
        if summ['total_cost_usd'] > 0:
            summ['return_pct'] = (summ['net_profit_usd'] / summ['total_cost_usd']) * 100
        else:
            summ['return_pct'] = 0.0
            
    # Calculate monthly summary
    monthly_summary = {}
    for r in all_runs:
        dt = datetime.strptime(r['date'], '%Y-%m-%d')
        ym_str = dt.strftime('%Y-%m') # e.g. "2024-05"
        
        if ym_str not in monthly_summary:
            monthly_summary[ym_str] = {
                'cost_usd': 0.0,
                'profit_usd': 0.0,
                'profit_brl': 0.0,
                'sales_brl': 0.0
            }
        
        monthly_summary[ym_str]['cost_usd'] += r['cost_usd']
        monthly_summary[ym_str]['profit_usd'] += r['profit_usd']
        monthly_summary[ym_str]['profit_brl'] += r['profit_brl']
        monthly_summary[ym_str]['sales_brl'] += r['proceeds_brl']
        
    for ym, m_data in monthly_summary.items():
        if m_data['cost_usd'] > 0:
            m_data['return_pct'] = (m_data['profit_usd'] / m_data['cost_usd']) * 100
        else:
            m_data['return_pct'] = 0.0
            
    # Calculate Period summary
    period_summary = {
        'total_cost_usd': sum(r['cost_usd'] for r in all_runs),
        'total_profit_usd': sum(r['profit_usd'] for r in all_runs),
        'total_profit_brl': sum(r['profit_brl'] for r in all_runs),
        'total_sales_brl': sum(r['proceeds_brl'] for r in all_runs),
        'return_pct': 0.0
    }
    if period_summary['total_cost_usd'] > 0:
        period_summary['return_pct'] = (period_summary['total_profit_usd'] / period_summary['total_cost_usd']) * 100

    # 8. Save reports
    # CSV report
    with open(REPORT_CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Symbol', 'Type', 'Quantity', 'Buy Price (USD)', 'Sell Price (USD)', 'Profit/Loss (USD)', 'Profit/Loss (%)', 'Profit/Loss 30D (%)', 'Profit/Loss (BRL)', 'Days Held'])
        for r in all_runs:
            p30 = f"{r['profit_pct_30d']:.2f}" if r['profit_pct_30d'] is not None else "N/A"
            writer.writerow([
                r['date'],
                r['symbol'],
                r['trade_type'],
                f"{r['quantity']:.5f}".rstrip('0').rstrip('.'),
                f"{r['buy_price']:.4f}",
                f"{r['sell_price']:.4f}",
                f"{r['profit_usd']:.2f}",
                f"{r['profit_pct']:.2f}",
                p30,
                f"{r['profit_brl']:.2f}",
                f"{int(round(r['days_held']))}"
            ])
            
    # Markdown report
    with open(REPORT_MD_PATH, 'w', encoding='utf-8') as f:
        f.write("# Relatório de Imposto sobre Operações no Exterior (2023 - 2026)\n\n")
        f.write("Este relatório consolida todas as operações de compra e venda de ações e opções realizadas nas corretoras Avenue e Tastytrade, aplicando as regras de tributação brasileiras para cada ano-calendário.\n\n")
        
        f.write("## Resumo Geral do Período (2023 - 2026)\n\n")
        p_net_usd = period_summary['total_profit_usd']
        p_sign = "+" if p_net_usd >= 0 else ""
        p_pct_sign = "+" if period_summary['return_pct'] >= 0 else ""
        f.write(f"- **Custo Total de Aquisição:** ${period_summary['total_cost_usd']:,.2f} USD\n")
        f.write(f"- **Resultado Líquido do Período:** {p_sign}${p_net_usd:,.2f} USD ({p_pct_sign}{period_summary['return_pct']:.2f}%)\n")
        f.write(f"- **Resultado Líquido em BRL:** {p_sign}R$ {period_summary['total_profit_brl']:,.2f} BRL\n")
        f.write(f"- **Vendas Totais:** R$ {period_summary['total_sales_brl']:,.2f} BRL\n\n")
        
        f.write("## Resumo Anual de Impostos\n\n")
        f.write("| Ano | Custo Total (USD) | Lucro Líquido (USD) | Retorno (%) | Imposto Devido (BRL) | Prejuízo a Compensar (USD) |\n")
        f.write("| --- | --- | --- | --- | --- | --- |\n")
        for y in years:
            summ = annual_summary[y]
            net_usd = summ['net_profit_usd']
            pct_sign = "+" if summ['return_pct'] >= 0 else ""
            sign = "+" if net_usd >= 0 else ""
            if y == '2023':
                f.write(f"| 2023 | ${summ['total_cost_usd']:,.2f} | {sign}${net_usd:,.2f} | {pct_sign}{summ['return_pct']:.2f}% | R$ {summ['tax_due_brl']:,.2f} | R$ 0.00 |\n")
            else:
                f.write(f"| {y} | ${summ['total_cost_usd']:,.2f} | {sign}${net_usd:,.2f} | {pct_sign}{summ['return_pct']:.2f}% | R$ {summ['tax_due_brl']:,.2f} | ${summ['carry_forward_loss_usd']:,.2f} |\n")
                
        f.write("\n> [!NOTE]\n")
        f.write("> **Tributação 2023:** Isenção mensal para vendas totais de até R$ 35.000,00. Lucros acima desse limite tributados a 15% (sem compensação de prejuízos de meses anteriores).\n")
        f.write("> **Tributação 2024-2026:** Alíquota fixa de 15% sobre o lucro líquido anual consolidado. Compensação de perdas acumuladas permitida.\n\n")
        
        f.write("## Resumo Mensal das Operações\n\n")
        f.write("| Mês | Custo Total (USD) | Resultado Líquido (USD) | Retorno (%) | Resultado Líquido (BRL) | Vendas Totais (BRL) |\n")
        f.write("| --- | --- | --- | --- | --- | --- |\n")
        for ym in sorted(list(monthly_summary.keys())):
            m_data = monthly_summary[ym]
            m_net_usd = m_data['profit_usd']
            m_sign = "+" if m_net_usd >= 0 else ""
            m_pct_sign = "+" if m_data['return_pct'] >= 0 else ""
            f.write(f"| {ym} | ${m_data['cost_usd']:,.2f} | {m_sign}${m_net_usd:,.2f} | {m_pct_sign}{m_data['return_pct']:.2f}% | {m_sign}R$ {m_data['profit_brl']:,.2f} | R$ {m_data['sales_brl']:,.2f} |\n")
        f.write("\n")
        
        f.write("## Histórico Detalhado de Operações\n\n")
        f.write("| Data | Ativo | Tipo | Quantidade | Preço Compra (USD) | Preço Venda (USD) | Lucro/Prejuízo (USD) | Lucro/Prejuízo (%) | Retorno 30D (%) | Lucro/Prejuízo (BRL) | Dias |\n")
        f.write("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n")
        for r in all_runs:
            days_str = str(int(round(r['days_held'])))
            pct_sign = "+" if r['profit_pct'] >= 0 else ""
            if r['profit_pct_30d'] is not None:
                p30_sign = "+" if r['profit_pct_30d'] >= 0 else ""
                p30_str = f"{p30_sign}{r['profit_pct_30d']:.2f}%"
            else:
                p30_str = "N/A"
            f.write(f"| {r['date']} | {r['symbol']} | {r['trade_type']} | {r['quantity']:.4f} | ${r['buy_price']:,.4f} | ${r['sell_price']:,.4f} | ${r['profit_usd']:,.2f} | {pct_sign}{r['profit_pct']:.2f}% | {p30_str} | R$ {r['profit_brl']:,.2f} | {days_str} |\n")
            
    # HTML report
    REPORT_HTML_PATH = os.path.join(WORKSPACE_DIR, "detailed_report.html")
    
    # Calculate daily aggregates for chart
    daily_volume = {}
    for t in all_trades:
        d = t['date']
        if t['action'] in ['BUY', 'SELL']:
            daily_volume[d] = daily_volume.get(d, 0.0) + t['total_usd']
            
    daily_profit = {}
    for r in all_runs:
        d = r['date']
        daily_profit[d] = daily_profit.get(d, 0.0) + r['profit_usd']
        
    all_dates = sorted(list(set(list(daily_volume.keys()) + list(daily_profit.keys()))))
    
    chart_dates = all_dates
    chart_volumes = [round(daily_volume.get(d, 0.0), 2) for d in all_dates]
    chart_profits = [round(daily_profit.get(d, 0.0), 2) for d in all_dates]
    
    chart_dates_json = json.dumps(chart_dates)
    chart_volumes_json = json.dumps(chart_volumes)
    chart_profits_json = json.dumps(chart_profits)
    
    # Generate Period summary card
    p_net_usd = period_summary['total_profit_usd']
    p_net_class = "text-success" if p_net_usd >= 0 else "text-danger"
    p_sign = "+" if p_net_usd >= 0 else ""
    p_pct_sign = "+" if period_summary['return_pct'] >= 0 else ""
    
    cards_html = f"""
    <div class="card card-highlight">
        <div class="card-title">Total do Período (2023-2026)</div>
        <div class="card-value {p_net_class}">{p_sign}${p_net_usd:,.2f} USD <span style="font-size: 0.95rem; font-weight: 500;">({p_pct_sign}{period_summary['return_pct']:.2f}%)</span></div>
        <div class="card-info">
            Custo Total: ${period_summary['total_cost_usd']:,.2f} USD<br>
            Vendas Totais: R$ {period_summary['total_sales_brl']:,.2f} BRL<br>
            Resultado BRL: <span class="{p_net_class}" style="font-weight: 600;">{p_sign}R$ {period_summary['total_profit_brl']:,.2f}</span>
        </div>
    </div>
    """
    
    for y in years:
        summ = annual_summary[y]
        if y == '2023':
            net_usd = (summ['swing_profit_usd'] + summ['day_profit_usd']) - (summ['swing_loss_usd'] + summ['day_loss_usd'])
            net_class = "text-success" if net_usd >= 0 else "text-danger"
            sign = "+" if net_usd >= 0 else ""
            pct_sign = "+" if summ['return_pct'] >= 0 else ""
            return_str = f" ({pct_sign}{summ['return_pct']:.2f}%)" if summ['total_cost_usd'] > 0 else " (0.00%)"
            cards_html += f"""
            <div class="card">
                <div class="card-title">Consolidado {y}</div>
                <div class="card-value {net_class}">{sign}${net_usd:,.2f} USD <span style="font-size: 0.95rem; font-weight: 500;">{return_str}</span></div>
                <div class="card-info">
                    Tributação Mensal (GCAP)<br>
                    Vendas Totais: R$ {summ['total_sales_brl']:,.2f}<br>
                    Imposto Devido: R$ {summ['tax_due_brl']:,.2f}
                </div>
            </div>
            """
        else:
            net_usd = (summ['swing_profit_usd'] + summ['day_profit_usd']) - (summ['swing_loss_usd'] + summ['day_loss_usd'])
            net_class = "text-success" if net_usd >= 0 else "text-danger"
            sign = "+" if net_usd >= 0 else ""
            pct_sign = "+" if summ['return_pct'] >= 0 else ""
            cards_html += f"""
            <div class="card">
                <div class="card-title">Consolidado {y}</div>
                <div class="card-value {net_class}">{sign}${net_usd:,.2f} USD <span style="font-size: 0.95rem; font-weight: 500;">({pct_sign}{summ['return_pct']:.2f}%)</span></div>
                <div class="card-info">
                    Imposto Devido: <strong style="color: var(--text-color)">R$ {summ['tax_due_brl']:,.2f}</strong><br>
                    Prejuízo Acumulado: ${summ['carry_forward_loss_usd']:,.2f} USD<br>
                    <span style="font-size: 11px; display: block; margin-top: 5px;">Swing: +${summ['swing_profit_usd']:,.2f} / -${summ['swing_loss_usd']:,.2f}</span>
                    <span style="font-size: 11px; display: block;">Day: +${summ['day_profit_usd']:,.2f} / -${summ['day_loss_usd']:,.2f}</span>
                </div>
            </div>
            """
            
    rows_html = ""
    for r in all_runs:
        badge = "badge-dt" if r['trade_type'] == 'Day Trade' else "badge-st"
        profit_class = "text-success" if r['profit_usd'] >= 0 else "text-danger"
        sign = "+" if r['profit_usd'] >= 0 else ""
        pct_sign = "+" if r['profit_pct'] >= 0 else ""
        qty_str = f"{r['quantity']:.5f}".rstrip('0').rstrip('.')
        days_str = str(int(round(r['days_held'])))
        
        if r['profit_pct_30d'] is not None:
            p30_sign = "+" if r['profit_pct_30d'] >= 0 else ""
            class_30d = "text-success" if r['profit_pct_30d'] >= 0 else "text-danger"
            val_30d_str = f"{p30_sign}{r['profit_pct_30d']:.2f}%"
        else:
            class_30d = "text-muted"
            val_30d_str = "N/A"
            
        rows_html += f"""
        <tr data-symbol="{r['symbol']}" data-type="{r['trade_type']}">
            <td>{r['date']}</td>
            <td><strong>{r['symbol']}</strong></td>
            <td><span class="badge {badge}">{r['trade_type']}</span></td>
            <td>{qty_str}</td>
            <td>${r['buy_price']:,.4f}</td>
            <td>${r['sell_price']:,.4f}</td>
            <td class="{profit_class}">{sign}${r['profit_usd']:,.2f}</td>
            <td class="{profit_class}">{pct_sign}{r['profit_pct']:.2f}%</td>
            <td class="{class_30d}">{val_30d_str}</td>
            <td class="{profit_class}">{sign}R$ {r['profit_brl']:,.2f}</td>
            <td>{days_str}</td>
        </tr>
        """
        
    monthly_rows_html = ""
    for ym in sorted(list(monthly_summary.keys())):
        m_data = monthly_summary[ym]
        profit_class = "text-success" if m_data['profit_usd'] >= 0 else "text-danger"
        sign = "+" if m_data['profit_usd'] >= 0 else ""
        pct_sign = "+" if m_data['return_pct'] >= 0 else ""
        
        monthly_rows_html += f"""
        <tr>
            <td><strong>{ym}</strong></td>
            <td>${m_data['cost_usd']:,.2f}</td>
            <td class="{profit_class}">{sign}${m_data['profit_usd']:,.2f}</td>
            <td class="{profit_class}">{pct_sign}{m_data['return_pct']:.2f}%</td>
            <td class="{profit_class}">{sign}R$ {m_data['profit_brl']:,.2f}</td>
            <td>R$ {m_data['sales_brl']:,.2f}</td>
        </tr>
        """
        
    html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Impostos no Exterior (2023-2026)</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {{
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --border-color: #334155;
            --text-color: #f8fafc;
            --text-muted: #94a3b8;
            --primary-color: #3b82f6;
            --success-color: #10b981;
            --danger-color: #ef4444;
        }}
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
        }}
        body {{
            background-color: var(--bg-color);
            color: var(--text-color);
            padding: 2rem;
            line-height: 1.5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        header {{
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }}
        h1 {{
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }}
        .subtitle {{
            color: var(--text-muted);
            font-size: 1rem;
        }}
        .dashboard-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}
        .card {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }}
        .card-highlight {{
            border: 2px solid var(--primary-color);
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }}
        .card-title {{
            color: var(--text-muted);
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }}
        .card-value {{
            font-size: 1.35rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }}
        .card-info {{
            font-size: 0.8rem;
            color: var(--text-muted);
            line-height: 1.4;
        }}
        .chart-container {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2.5rem;
        }}
        .tabs {{
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
        }}
        .tab-btn {{
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            transition: all 0.2s;
        }}
        .tab-btn:hover {{
            color: var(--text-color);
        }}
        .tab-btn.active {{
            color: var(--primary-color);
            background-color: rgba(59, 130, 246, 0.1);
        }}
        .tab-content {{
            display: none;
        }}
        .tab-content.active {{
            display: block;
        }}
        .filter-bar {{
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }}
        .search-input {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-color);
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            width: 100%;
            max-width: 300px;
        }}
        .search-input:focus {{
            outline: none;
            border-color: var(--primary-color);
        }}
        .table-container {{
            width: 100%;
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background-color: var(--card-bg);
        }}
        th, td {{
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }}
        th {{
            background-color: rgba(255,255,255,0.02);
            color: var(--text-muted);
            font-weight: 600;
            font-size: 0.875rem;
        }}
        td {{
            font-size: 0.9rem;
        }}
        tr:last-child td {{
            border-bottom: none;
        }}
        tr:hover td {{
            background-color: rgba(255,255,255,0.01);
        }}
        .badge {{
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }}
        .badge-dt {{
            background-color: rgba(59, 130, 246, 0.1);
            color: var(--primary-color);
        }}
        .badge-st {{
            background-color: rgba(168, 85, 247, 0.1);
            color: #a855f7;
        }}
        .text-success {{
            color: var(--success-color);
        }}
        .text-danger {{
            color: var(--danger-color);
        }}
        .alert {{
            background-color: rgba(59, 130, 246, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
            color: var(--text-muted);
        }}
        .alert strong {{
            color: var(--text-color);
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Relatório Consolidado de Operações no Exterior</h1>
            <div class="subtitle">Análise de Imposto de Renda (2023 - 2026) | Avenue & Tastytrade</div>
        </header>

        <div class="alert">
            <strong>Regras de Tributação Aplicadas:</strong><br>
            • <strong>2023:</strong> Isenção mensal para vendas totais de até R$ 35.000,00. Lucros acima do limite tributados a 15% (sem compensação de prejuízos de meses anteriores).<br>
            • <strong>2024 - 2026 (Lei 14.754/2023):</strong> Alíquota fixa de 15% sobre o lucro líquido anual consolidado. Compensação de perdas acumuladas permitida.
        </div>

        <h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Consolidado Anual</h2>
        <div class="dashboard-grid">
            {cards_html}
        </div>

        <div class="chart-container">
            <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Volume e Resultado Diário das Operações (USD)</h2>
            <div style="position: relative; height: 300px; width: 100%;">
                <canvas id="operationsChart"></canvas>
            </div>
        </div>

        <h2 style="margin-bottom: 1rem; font-size: 1.5rem; margin-top: 2.5rem;">Resumo Mensal consolidado</h2>
        <div class="table-container" style="margin-bottom: 2.5rem;">
            <table>
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th>Custo total de Aquisição (USD)</th>
                        <th>Resultado Líquido (USD)</th>
                        <th>Retorno (%)</th>
                        <th>Resultado Líquido (BRL)</th>
                        <th>Vendas Totais (BRL)</th>
                    </tr>
                </thead>
                <tbody>
                    {monthly_rows_html}
                </tbody>
            </table>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('all')">Todas as Operações</button>
            <button class="tab-btn" onclick="switchTab('Swing Trade')">Swing Trade</button>
            <button class="tab-btn" onclick="switchTab('Day Trade')">Day Trade</button>
        </div>

        <div class="filter-bar">
            <input type="text" id="searchInput" class="search-input" onkeyup="filterTable()" placeholder="Buscar por ativo (ex: NVDA)...">
        </div>

        <div class="table-container">
            <table id="tradesTable">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Ativo</th>
                        <th>Tipo</th>
                        <th>Quantidade</th>
                        <th>Preço Compra</th>
                        <th>Preço Venda</th>
                        <th>Resultado (USD)</th>
                        <th>Resultado (%)</th>
                        <th>Retorno 30D</th>
                        <th>Resultado (BRL)</th>
                        <th>Dias</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let currentTab = 'all';

        function switchTab(tab) {{
            currentTab = tab;
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => {{
                if (btn.innerText.includes(tab) || (tab === 'all' && btn.innerText.includes('Todas'))) {{
                    btn.classList.add('active');
                }} else {{
                    btn.classList.remove('active');
                }}
            }});
            filterTable();
        }}

        function filterTable() {{
            const input = document.getElementById('searchInput');
            const filter = input.value.toUpperCase();
            const table = document.getElementById('tradesTable');
            const tr = table.getElementsByTagName('tr');

            for (let i = 1; i < tr.length; i++) {{
                const tdSymbol = tr[i].getElementsByTagName('td')[1];
                const type = tr[i].getAttribute('data-type');
                
                if (tdSymbol) {{
                    const symbolText = tdSymbol.textContent || tdSymbol.innerText;
                    const matchesSymbol = symbolText.toUpperCase().indexOf(filter) > -1;
                    const matchesTab = (currentTab === 'all' || type === currentTab);
                    
                    if (matchesSymbol && matchesTab) {{
                        tr[i].style.display = "";
                    }} else {{
                        tr[i].style.display = "none";
                    }}
                }}
            }}
        }}

        // Render Chart.js
        const ctx = document.getElementById('operationsChart').getContext('2d');
        const chartDates = {chart_dates_json};
        const chartVolumes = {chart_volumes_json};
        const chartProfits = {chart_profits_json};

        new Chart(ctx, {{
            type: 'bar',
            data: {{
                labels: chartDates,
                datasets: [
                    {{
                        label: 'Resultado Realizado (USD)',
                        data: chartProfits,
                        backgroundColor: chartProfits.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
                        borderColor: chartProfits.map(v => v >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'),
                        borderWidth: 1,
                        yAxisID: 'yProfit'
                    }},
                    {{
                        label: 'Volume de Negociação (USD)',
                        data: chartVolumes,
                        type: 'line',
                        fill: false,
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        tension: 0.1,
                        yAxisID: 'yVolume'
                    }}
                ]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    x: {{
                        grid: {{
                            color: 'rgba(255, 255, 255, 0.05)'
                        }},
                        ticks: {{
                            color: '#94a3b8',
                            font: {{
                                family: 'Inter',
                                size: 10
                            }}
                        }}
                    }},
                    yProfit: {{
                        type: 'linear',
                        position: 'left',
                        grid: {{
                            color: 'rgba(255, 255, 255, 0.05)'
                        }},
                        ticks: {{
                            color: '#94a3b8',
                            font: {{
                                family: 'Inter',
                                size: 10
                            }}
                        }},
                        title: {{
                            display: true,
                            text: 'Resultado Realizado ($)',
                            color: '#94a3b8',
                            font: {{
                                family: 'Inter',
                                size: 11
                            }}
                        }}
                    }},
                    yVolume: {{
                        type: 'linear',
                        position: 'right',
                        grid: {{
                            drawOnChartArea: false
                        }},
                        ticks: {{
                            color: '#94a3b8',
                            font: {{
                                family: 'Inter',
                                size: 10
                            }}
                        }},
                        title: {{
                            display: true,
                            text: 'Volume de Negociação ($)',
                            color: '#94a3b8',
                            font: {{
                                family: 'Inter',
                                size: 11
                            }}
                        }}
                    }}
                }},
                plugins: {{
                    legend: {{
                        labels: {{
                            color: '#f8fafc',
                            font: {{
                                family: 'Inter',
                                size: 12
                            }}
                        }}
                    }},
                    tooltip: {{
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {{
                            label: function(context) {{
                                let label = context.dataset.label || '';
                                if (label) {{
                                    label += ': ';
                                }}
                                if (context.parsed.y !== null) {{
                                    label += new Intl.NumberFormat('en-US', {{ style: 'currency', currency: 'USD' }}).format(context.parsed.y);
                                }}
                                return label;
                            }}
                        }}
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>
"""
    with open(REPORT_HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print("Report generation completed successfully!")
    print(f"CSV report saved to {REPORT_CSV_PATH}")
    print(f"Markdown report saved to {REPORT_MD_PATH}")
    print(f"HTML report saved to {REPORT_HTML_PATH}")

if __name__ == '__main__':
    run_main()
