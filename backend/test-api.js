// Test script to verify backend API is working
// Run with: node test-api.js

const { query } = require('./config/database');

const testAPI = async () => {
  try {
    console.log('🧪 Testing MediVault API...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log(healthData.success ? '✅ Health check passed' : '❌ Health check failed');
    console.log('   Response:', healthData.message, '\n');

    // Test 2: Create User
    console.log('2️⃣ Testing user creation...');
    const unique = Date.now();
    const createUserResponse = await fetch('http://localhost:5000/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test Patient',
        email: `testpatient${unique}@example.com`,
        username: `testpatient${unique}`,
        password: 'password123',
        role: 'patient',
        nic: `NIC${unique}`,
        rfid: `RFID${unique}`,
        dateOfBirth: '1990-01-01',
        gender: 'female',
        phoneNumber: '+94771234567',
        address: 'Test Address',
        bloodType: 'A+',
        allergies: 'None',
      }),
    });
    
    const createUserData = await createUserResponse.json();
    if (createUserData.success) {
      console.log('✅ User created successfully');
      console.log('   User ID:', createUserData.data.id);
      console.log('   Name:', createUserData.data.fullName);
      console.log('   Email:', createUserData.data.email);
      console.log('   Role:', createUserData.data.role, '\n');

      console.log('2️⃣a Verifying patients table insert...');
      try {
        const patientRes = await query('SELECT id, user_id, nic, rfid FROM patients WHERE user_id = $1', [
          createUserData.data.id,
        ]);
        if (patientRes.rows.length > 0) {
          console.log('✅ Patient row found');
          console.log('   Patient ID:', patientRes.rows[0].id);
          console.log('   NIC:', patientRes.rows[0].nic);
          console.log('   RFID:', patientRes.rows[0].rfid, '\n');
        } else {
          console.log('❌ No patient row found for user_id', createUserData.data.id, '\n');
        }
      } catch (e) {
        console.log('❌ Failed to query patients table');
        console.log('   Error:', e.message, '\n');
      }
    } else {
      console.log('❌ User creation failed');
      console.log('   Error:', createUserData.message, '\n');
    }

    // Test 2b: Create Lab Technician User + verify insert + delete
    console.log('2️⃣b Testing lab technician user creation...');
    const uniqueLab = Date.now();
    const createLabResponse = await fetch('http://localhost:5000/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test Lab Technician',
        email: `testlabtech${uniqueLab}@example.com`,
        username: `testlabtech${uniqueLab}`,
        password: 'password123',
        role: 'lab_technician',
        labTechnicianSpecialization: 'Clinical Pathology',
        labTechnicianLicenseNumber: `LK-LAB-${uniqueLab}`,
      }),
    });

    const createLabData = await createLabResponse.json();
    if (createLabData.success) {
      console.log('✅ Lab technician created successfully');
      console.log('   User ID:', createLabData.data.id);
      console.log('   Role:', createLabData.data.role, '\n');

      console.log('2️⃣b-a Verifying lab_technicians table insert...');
      try {
        const labRes = await query(
          'SELECT id, user_id, specialization, license_number FROM lab_technicians WHERE user_id = $1',
          [createLabData.data.id]
        );
        if (labRes.rows.length > 0) {
          console.log('✅ Lab technician row found');
          console.log('   LabTech ID:', labRes.rows[0].id);
          console.log('   Specialization:', labRes.rows[0].specialization);
          console.log('   License:', labRes.rows[0].license_number, '\n');
        } else {
          console.log('❌ No lab technician row found for user_id', createLabData.data.id, '\n');
        }
      } catch (e) {
        console.log('❌ Failed to query lab_technicians table');
        console.log('   Error:', e.message, '\n');
      }

      console.log('2️⃣b-b Testing lab technician deletion...');
      const deleteLabResponse = await fetch(`http://localhost:5000/api/users/${createLabData.data.id}`, {
        method: 'DELETE',
      });
      const deleteLabData = await deleteLabResponse.json();
      console.log(deleteLabData.success ? '✅ Delete call succeeded' : '❌ Delete call failed');
      console.log('   Response:', deleteLabData.message, '\n');

      console.log('2️⃣b-c Verifying lab_technicians row removed...');
      try {
        const labAfterDelete = await query('SELECT id FROM lab_technicians WHERE user_id = $1', [createLabData.data.id]);
        if (labAfterDelete.rows.length === 0) {
          console.log('✅ Lab technician row removed successfully', '\n');
        } else {
          console.log('❌ Lab technician row still exists after delete', '\n');
        }
      } catch (e) {
        console.log('❌ Failed to re-query lab_technicians table');
        console.log('   Error:', e.message, '\n');
      }
    } else {
      console.log('❌ Lab technician creation failed');
      console.log('   Error:', createLabData.message, '\n');
    }

    // Test 2c: Create Pharmacist User + verify insert + delete
    console.log('2️⃣c Testing pharmacist user creation...');
    const uniquePharm = Date.now();
    const createPharmResponse = await fetch('http://localhost:5000/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test Pharmacist',
        email: `testpharmacist${uniquePharm}@example.com`,
        username: `testpharmacist${uniquePharm}`,
        password: 'password123',
        role: 'pharmacist',
        pharmacistLicenseNumber: `LK-PHARM-${uniquePharm}`,
      }),
    });

    const createPharmData = await createPharmResponse.json();
    if (createPharmData.success) {
      console.log('✅ Pharmacist created successfully');
      console.log('   User ID:', createPharmData.data.id);
      console.log('   Role:', createPharmData.data.role, '\n');

      console.log('2️⃣c-a Verifying pharmacists table insert...');
      try {
        const pharmRes = await query('SELECT id, user_id, license_number FROM pharmacists WHERE user_id = $1', [
          createPharmData.data.id,
        ]);
        if (pharmRes.rows.length > 0) {
          console.log('✅ Pharmacist row found');
          console.log('   Pharmacist ID:', pharmRes.rows[0].id);
          console.log('   License:', pharmRes.rows[0].license_number, '\n');
        } else {
          console.log('❌ No pharmacist row found for user_id', createPharmData.data.id, '\n');
        }
      } catch (e) {
        console.log('❌ Failed to query pharmacists table');
        console.log('   Error:', e.message, '\n');
      }

      console.log('2️⃣c-b Testing pharmacist deletion...');
      const deletePharmResponse = await fetch(`http://localhost:5000/api/users/${createPharmData.data.id}`, {
        method: 'DELETE',
      });
      const deletePharmData = await deletePharmResponse.json();
      console.log(deletePharmData.success ? '✅ Delete call succeeded' : '❌ Delete call failed');
      console.log('   Response:', deletePharmData.message, '\n');

      console.log('2️⃣c-c Verifying pharmacists row removed...');
      try {
        const pharmAfterDelete = await query('SELECT id FROM pharmacists WHERE user_id = $1', [createPharmData.data.id]);
        if (pharmAfterDelete.rows.length === 0) {
          console.log('✅ Pharmacist row removed successfully', '\n');
        } else {
          console.log('❌ Pharmacist row still exists after delete', '\n');
        }
      } catch (e) {
        console.log('❌ Failed to re-query pharmacists table');
        console.log('   Error:', e.message, '\n');
      }
    } else {
      console.log('❌ Pharmacist creation failed');
      console.log('   Error:', createPharmData.message, '\n');
    }

    // Test 3: Get All Users
    console.log('3️⃣ Testing get all users...');
    const usersResponse = await fetch('http://localhost:5000/api/users');
    const usersData = await usersResponse.json();
    if (usersData.success) {
      console.log('✅ Retrieved users successfully');
      console.log('   Total users:', usersData.data.length);
      console.log('   Users:', usersData.data.map(u => u.fullName).join(', '), '\n');
    } else {
      console.log('❌ Failed to retrieve users', '\n');
    }

    console.log('✅ All API tests completed!\n');
    console.log('📝 Your backend is ready to use with the React Native app.');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\n⚠️  Make sure:');
    console.log('   1. Backend server is running (npm run dev in backend folder)');
    console.log('   2. PostgreSQL is running and database is created');
    console.log('   3. Port 5000 is available\n');
  }
};

testAPI();
