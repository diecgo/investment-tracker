
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mitvvaxgrbostgcetswk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdHZ2YXhncmJvc3RnY2V0c3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTY1MjksImV4cCI6MjA4MTA5MjUyOX0.RYYO8vd37NfhHZM2L1IcQQ_cuRGTeUI4y2boalhi8Lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // We are using anon key, so we need to sign in or use admin secret...
    // Actually anon key only works if we have RLS policies allowing anon access OR we sign in.
    // Since this is a script, we are NOT signed in.

    // Quick fix: Ask user for their user ID or just try to select everything if RLS allows.
    // If RLS is on 'user_id = auth.uid()', then anon request sees nothing.

    console.log("Fetching transactions...");
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching transactions:', error);
        return;
    }

    console.table(transactions.map(t => ({
        id: t.id.substring(0, 8),
        type: t.type,
        amount: t.amount,
        desc: t.description,
        qty: t.quantity,
        date: t.date
    })));

    // Calculate totals
    let deposit = 0;
    let withdraw = 0;
    let buy = 0;
    let sell = 0;
    let adjust = 0;

    transactions.forEach(t => {
        switch (t.type) {
            case 'Deposit': deposit += t.amount; break;
            case 'Withdraw': withdraw += t.amount; break;
            case 'Buy': buy += t.amount; break;
            case 'Sell': sell += t.amount; break;
            case 'Adjustment': adjust += t.amount; break;
        }
    });

    console.log('--- TOTALS ---');
    console.log('Deposit:', deposit);
    console.log('Withdraw:', withdraw);
    console.log('Buy:', buy);
    console.log('Sell:', sell);
    console.log('Adjustment:', adjust);
    console.log('Calculated Capital:', deposit - withdraw - buy + sell + adjust);
}

main();
