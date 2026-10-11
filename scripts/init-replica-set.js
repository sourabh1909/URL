const { MongoClient } = require('mongodb');

async function init() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/?directConnection=true');
  try {
    await client.connect();
    const admin = client.db('admin');
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log('✅ Replica set is already active:', status.set);
      return;
    } catch (e) {
      if (e.message && e.message.includes('not running with --replSet')) {
        console.error('❌ MongoDB service is not yet running with replSetName configured.');
        console.error('Please make sure mongod.cfg has replication.replSetName set and the service is restarted.');
        process.exit(1);
      }
      console.log('Initiating replica set rs0...');
      await admin.command({
        replSetInitiate: {
          _id: 'rs0',
          members: [{ _id: 0, host: '127.0.0.1:27017' }],
        },
      });
      console.log('✅ Replica set rs0 initiated successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

init();
