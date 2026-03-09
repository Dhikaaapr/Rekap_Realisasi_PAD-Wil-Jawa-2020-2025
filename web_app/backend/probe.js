require('@supabase/supabase-js');
const net = require('net');
const s = net.createServer().listen(3016, () => console.log('listen cb'));
setTimeout(() => console.log('handles', process._getActiveHandles().length), 100);
