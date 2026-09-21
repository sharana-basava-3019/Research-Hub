const axios = require('axios');

async function testEventsAPI() {
  try {
    console.log('🔍 Testing Events API...\n');
    
    const response = await axios.get('http://localhost:5000/api/events');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Events Count:', response.data.count);
    console.log('\nEvents:');
    response.data.data.events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.category} (${event.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testEventsAPI();
