transactions.push({
      id: uuidv4(),
      date,
      description: description.substring(0, 100),
      amount,
      type,
      category: categorize(description),
      rawLine: match[0].substring(0, 150),
    });
  }
  return transactions;
}

function generateDemoTransactions() {
  const demos = [
    { desc: 'Swiggy Order #1234', amount: 349, type: 'debit', daysAgo: 1 },
    { desc: 'Amazon Shopping - Electronics', amount: 2999, type: 'debit', daysAgo: 2 },
    { desc: 'Salary Credit', amount: 45000, type: 'credit', daysAgo: 3 },
    { desc: 'Uber Ride to Airport', amount: 450, type: 'debit', daysAgo: 4 },
    { desc: 'Netflix Subscription', amount: 649, type: 'debit', daysAgo: 5 },
    { desc: 'Zomato Food Order', amount: 280, type: 'debit', daysAgo: 6 },
    { desc: 'Airtel Postpaid Bill', amount: 999, type: 'debit', daysAgo: 7 },
    { desc: 'Flipkart Purchase - Shoes', amount: 1799, type: 'debit', daysAgo: 8 },
    { desc: 'Apollo Pharmacy', amount: 560, type: 'debit', daysAgo: 9 },
    { desc: 'IRCTC Train Ticket', amount: 1250, type: 'debit', daysAgo: 10 },
    { desc: 'Dominos Pizza Order', amount: 520, type: 'debit', daysAgo: 11 },
    { desc: 'Myntra - Clothing', amount: 1499, type: 'debit', daysAgo: 12 },
    { desc: 'Udemy Course Purchase', amount: 499, type: 'debit', daysAgo: 13 },
    { desc: 'Starbucks Coffee', amount: 380, type: 'debit', daysAgo: 14 },
    { desc: 'OLA Cab Booking', amount: 230, type: 'debit', daysAgo: 15 },
    { desc: 'Electricity Bill BESCOM', amount: 1200, type: 'debit', daysAgo: 16 },
    { desc: 'BigBasket Grocery', amount: 1850, type: 'debit', daysAgo: 18 },
    { desc: 'PVR Cinema Tickets', amount: 680, type: 'debit', daysAgo: 19 },
    { desc: 'JIO Recharge', amount: 719, type: 'debit', daysAgo: 20 },
    { desc: 'MakeMyTrip Flight Booking', amount: 5400, type: 'debit', daysAgo: 22 },
    { desc: 'Freelance Payment Received', amount: 12000, type: 'credit', daysAgo: 23 },
    { desc: 'Amazon Prime Subscription', amount: 1499, type: 'debit', daysAgo: 25 },
    { desc: 'Decathlon Sports Equipment', amount: 3200, type: 'debit', daysAgo: 26 },
    { desc: 'DMart Grocery Shopping', amount: 2300, type: 'debit', daysAgo: 29 },
    { desc: 'YouTube Premium', amount: 189, type: 'debit', daysAgo: 30 },
  ];

  return demos.map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d.daysAgo);
    return {
      id: uuidv4(),
      date: date.toISOString().split('T')[0],
      description: d.desc,
      amount: d.amount,
      type: d.type,
      category: categorize(d.desc),
      rawLine: ${date.toISOString().split('T')[0]} | ${d.desc} | ${d.amount},
    };
  });
}

async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;
    if (!text || text.trim().length < 50) {
      throw new Error('PDF appears to be empty or scanned. Please use a text-based bank statement.');
    }
    const transactions = extractTransactions(text);
    if (transactions.length === 0) {
      throw new Error('No transactions found. Make sure it is a valid bank statement.');
    }
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { transactions, pageCount: data.numpages, rawTextLength: text.length };
  } catch (err) {
    if (err.message.includes('No transactions') || err.message.includes('empty')) throw err;
    throw new Error(Failed to parse PDF: ${err.message});
  }
}

module.exports = { parsePDF, generateDemoTransactions };
