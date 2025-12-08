// Test script to generate large JSON response for scrollbar testing
const largeData = {
  testData: [],
  metadata: {
    totalItems: 1000,
    timestamp: new Date().toISOString(),
    description: "Large dataset for scrollbar testing"
  }
};

// Generate a large dataset
for (let i = 0; i < 1000; i++) {
  largeData.testData.push({
    id: `item-${i}`,
    name: `Test Item ${i}`,
    value: Math.random() * 1000,
    status: i % 2 === 0 ? 'active' : 'inactive',
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: [`tag${i % 10}`, `category${i % 5}`],
      nested: {
        level1: {
          level2: {
            level3: `deep-value-${i}`
          }
        }
      }
    }
  });
}

console.log('Large test data generated:');
console.log('Total items:', largeData.testData.length);
console.log('Estimated size:', JSON.stringify(largeData).length, 'characters');
console.log('You can test this by visiting: http://localhost:3001/explorer');
console.log('Then navigate to a component and view its data - the scrollbar should appear for large responses.');