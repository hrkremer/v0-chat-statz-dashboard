#!/usr/bin/env python3
import sqlite3
import json
import re
from pathlib import Path
from datetime import datetime

def decode_attributed_body(attributed_body):
    """
    Decode the attributedBody blob to extract message text.
    This handles the NSString encoded format used in newer macOS versions.
    """
    if attributed_body is None:
        return None
    
    try:
        # Try to decode as UTF-8
        body_str = attributed_body.decode('utf-8', errors='replace')
    except (UnicodeDecodeError, AttributeError):
        # Already a string or can't decode
        body_str = str(attributed_body)
    
    # Extract text from NSString format
    if "NSString" in body_str:
        # Split on NSString and take the part after it
        body_str = body_str.split("NSString")[1]
    
    # Remove NSNumber sections if present
    if "NSNumber" in body_str:
        body_str = body_str.split("NSNumber")[0]
    
    # Remove NSDictionary sections if present
    if "NSDictionary" in body_str:
        body_str = body_str.split("NSDictionary")[0]
    
    # Clean up the text - remove common encoding artifacts
    # The text is usually between certain markers
    if len(body_str) > 12:
        body_str = body_str[6:-12]
    
    # Clean up newlines and extra spaces
    body_str = re.sub(r'\n', ' ', body_str)
    body_str = re.sub(r'\s+', ' ', body_str).strip()
    
    return body_str if body_str else None

def export_imessages(chat_id, year, month, output_path):
    """
    Export iMessages from a specific chat starting from a given month to today.
    """
    # Connect to the Messages database
    db_path = Path.home() / "Library/Messages/chat.db"
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        print("Make sure Terminal has Full Disk Access in System Settings > Privacy & Security")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Start date only - no end date
    start_date = f"{year}-{month:02d}-01"
    
    # Query messages from the specified chat from start_date to now
    query = """
    SELECT 
        COALESCE(h.id, 'Me') as sender,
        m.text,
        m.attributedBody,
        datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as date,
        m.is_from_me,
        m.cache_has_attachments,
        m.ROWID
    FROM message m
    JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE cmj.chat_id = ?
        AND datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') >= ?
    ORDER BY m.date ASC;
    """
    
    try:
        cursor.execute(query, (chat_id, start_date))
        results = cursor.fetchall()
        
        if not results:
            print(f"No messages found for chat ID {chat_id} in {year}-{month:02d}")
            conn.close()
            return
        
        # Convert to JSON format
        messages = []
        for row in results:
            sender, text, attributed_body, date, is_from_me, has_attachments, rowid = row
            
            # Try to get text from either column
            message_text = text
            if not message_text and attributed_body:
                message_text = decode_attributed_body(attributed_body)
            
            messages.append({
                "id": rowid,
                "sender": sender,
                "text": message_text,
                "date": date,
                "is_from_me": bool(is_from_me),
                "has_attachments": bool(has_attachments)
            })
        
        # Save to output file
        output_file = Path(output_path)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(messages, f, indent=2, ensure_ascii=False)
        
        conn.close()
        
        print(f"✅ Successfully exported {len(messages)} messages to {output_file}")
        print(f"   Chat ID: {chat_id}")
        print(f"   Date range: {start_date} to {end_date}")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        conn.close()

if __name__ == "__main__":
    # Configuration
    CHAT_ID = 8
    YEAR = 2025
    MONTH = 8  # August
    OUTPUT_PATH = Path.home() / "Desktop" / "imessages_chat8_august2025.json"
    
    print(f"Exporting iMessages from Chat ID {CHAT_ID} for {YEAR}-{MONTH:02d}...")
    export_imessages(CHAT_ID, YEAR, MONTH, OUTPUT_PATH)
