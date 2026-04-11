/**
 * Database Seeder for CoopVotes
 * Run with: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const Vote = require('../models/Vote');

// Load env vars
dotenv.config();

// Sample data
const users = [
  // Admin
  {
    email: 'admin@student.cuk.ac.ke',
    regNumber: 'ADMIN/001',
    department: 'ADMIN',
    yearOfStudy: 1,
    admissionYear: new Date().getFullYear(),
    role: 'admin',
    hasVoted: false,
    votedPositions: []
  },
  // Students - BIT Department
  {
    email: 'john.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2023/10001',
    department: 'BIT',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'jane.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2023/10002',
    department: 'BIT',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'alice.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2022/10003',
    department: 'BIT',
    yearOfStudy: 3,
    admissionYear: 2022,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  // Students - BBM Department
  {
    email: 'bob.bbm@student.cuk.ac.ke',
    regNumber: 'BBM/2023/20001',
    department: 'BBM',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'carol.bbm@student.cuk.ac.ke',
    regNumber: 'BBM/2023/20002',
    department: 'BBM',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  // Students - CS Department
  {
    email: 'dave.cs@student.cuk.ac.ke',
    regNumber: 'CS/2023/30001',
    department: 'CS',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'eve.cs@student.cuk.ac.ke',
    regNumber: 'CS/2022/30002',
    department: 'CS',
    yearOfStudy: 3,
    admissionYear: 2022,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  // President aspirants
  {
    email: 'president@student.cuk.ac.ke',
    regNumber: 'BIT/2021/10010',
    department: 'BIT',
    yearOfStudy: 4,
    admissionYear: 2021,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'janet.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2021/10011',
    department: 'BIT',
    yearOfStudy: 4,
    admissionYear: 2021,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  // Additional Congress Person aspirants
  {
    email: 'mark.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2022/10004',
    department: 'BIT',
    yearOfStudy: 3,
    admissionYear: 2022,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'brian.bbm@student.cuk.ac.ke',
    regNumber: 'BBM/2022/20003',
    department: 'BBM',
    yearOfStudy: 3,
    admissionYear: 2022,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'grace.cs@student.cuk.ac.ke',
    regNumber: 'CS/2022/30003',
    department: 'CS',
    yearOfStudy: 3,
    admissionYear: 2022,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  // Additional Delegate aspirants
  {
    email: 'peter.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2023/10005',
    department: 'BIT',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'sophia.bbm@student.cuk.ac.ke',
    regNumber: 'BBM/2023/20004',
    department: 'BBM',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'diana.cs@student.cuk.ac.ke',
    regNumber: 'CS/2023/30004',
    department: 'CS',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'aspirant',
    hasVoted: false,
    votedPositions: []
  },
  // Additional Student voters
  {
    email: 'james.bit@student.cuk.ac.ke',
    regNumber: 'BIT/2023/10006',
    department: 'BIT',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'lisa.bbm@student.cuk.ac.ke',
    regNumber: 'BBM/2023/20005',
    department: 'BBM',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  },
  {
    email: 'kevin.cs@student.cuk.ac.ke',
    regNumber: 'CS/2023/30005',
    department: 'CS',
    yearOfStudy: 2,
    admissionYear: 2023,
    role: 'student',
    hasVoted: false,
    votedPositions: []
  }
];

// Election data
const elections = [
  {
    name: 'Student Government Election 2026',
    year: 2026,
    isActive: true,
    status: 'active',
    startTime: new Date(),
    totalVoters: 9,
    totalVotes: 0,
    positions: [
      { name: 'President', department: null },
      { name: 'Congress Person', department: 'BIT' },
      { name: 'Congress Person', department: 'BBM' },
      { name: 'Congress Person', department: 'CS' },
      { name: 'Male Delegate', department: 'BIT' },
      { name: 'Male Delegate', department: 'BBM' },
      { name: 'Male Delegate', department: 'CS' },
      { name: 'Female Delegate', department: 'BIT' },
      { name: 'Female Delegate', department: 'BBM' },
      { name: 'Female Delegate', department: 'CS' }
    ]
  }
];

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('DB Connection Error:', error.message);
    process.exit(1);
  }
};

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Candidate.deleteMany({});
    await Election.deleteMany({});
    await Vote.deleteMany({});

    // Insert users
    console.log('Inserting users...');
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Find aspirants
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const presidentAspirant = createdUsers.find(u => u.email === 'president@student.cuk.ac.ke');
    const aliceAspirant = createdUsers.find(u => u.email === 'alice.bit@student.cuk.ac.ke');
    const carolAspirant = createdUsers.find(u => u.email === 'carol.bbm@student.cuk.ac.ke');
    const eveAspirant = createdUsers.find(u => u.email === 'eve.cs@student.cuk.ac.ke');

    // Create candidates
    console.log('Creating candidates...');
    const candidates = [
      // ===== PRESIDENT - Multiple Aspirants =====
      {
        userId: createdUsers.find(u => u.email === 'president@student.cuk.ac.ke')._id,
        position: 'President',
        department: null,
        manifesto: 'I will fight for better student facilities, improved WiFi, and more study spaces. Together we build!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=president',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'janet.bit@student.cuk.ac.ke')._id,
        position: 'President',
        department: null,
        manifesto: 'Accountability and transparency! I will ensure every student voice is heard and valued.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=janet',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== CONGRESS PERSON - BIT (Multiple) =====
      {
        userId: createdUsers.find(u => u.email === 'alice.bit@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BIT',
        manifesto: 'BIT students deserve better labs and more industry connections. Vote Alice!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'mark.bit@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BIT',
        manifesto: 'Let\'s revolutionize the BIT program with cutting-edge facilities and industry partnerships!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mark',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== CONGRESS PERSON - BBM (Multiple) =====
      {
        userId: createdUsers.find(u => u.email === 'carol.bbm@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BBM',
        manifesto: 'Business students need real-world exposure. I will organize more company visits!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'brian.bbm@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BBM',
        manifesto: 'Building careers and networks! Join me in creating opportunities for BBM students.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brian',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== CONGRESS PERSON - CS (Multiple) =====
      {
        userId: createdUsers.find(u => u.email === 'eve.cs@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'CS',
        manifesto: 'Code the future! More hackathons, better equipment, and 24/7 lab access.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'grace.cs@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'CS',
        manifesto: 'Innovation starts here. Let\'s make CS the hub of technology and creativity!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== MALE DELEGATE - BIT (Multiple) =====
      {
        userId: createdUsers.find(u => u.email === 'john.bit@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BIT',
        manifesto: 'Your voice in the student council. Let me represent you!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'peter.bit@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BIT',
        manifesto: 'Dedicated to supporting BIT male students and advocating for their needs.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peter',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== MALE DELEGATE - BBM (Multiple) =====
      {
        userId: createdUsers.find(u => u.email === 'bob.bbm@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BBM',
        manifesto: 'Representing BBM male students with pride and commitment.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== MALE DELEGATE - CS =====
      {
        userId: createdUsers.find(u => u.email === 'dave.cs@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'CS',
        manifesto: 'Working hard for CS male students. Your support fuels my drive!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== FEMALE DELEGATE - BIT (Multiple) =====
      {
        userId: createdUsers.find(u => u.email === 'jane.bit@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'BIT',
        manifesto: 'Empowering women in tech. Your concerns matter!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== FEMALE DELEGATE - BBM =====
      {
        userId: createdUsers.find(u => u.email === 'sophia.bbm@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'BBM',
        manifesto: 'Championing women\'s rights and equality in business education.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },

      // ===== FEMALE DELEGATE - CS =====
      {
        userId: createdUsers.find(u => u.email === 'diana.cs@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'CS',
        manifesto: 'Building a supportive community for all women in computing!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      }
    ];

    const createdCandidates = await Candidate.insertMany(candidates);
    console.log(`Created ${createdCandidates.length} candidates`);

    // Create election
    console.log('Creating election...');
    const createdElection = await Election.insertMany(elections);
    console.log(`Created election: ${createdElection[0].name}`);

    // Create some sample votes
    console.log('Creating sample votes...');
    const voters = [
      createdUsers.find(u => u.email === 'john.bit@student.cuk.ac.ke'),
      createdUsers.find(u => u.email === 'jane.bit@student.cuk.ac.ke'),
      createdUsers.find(u => u.email === 'bob.bbm@student.cuk.ac.ke'),
      createdUsers.find(u => u.email === 'dave.cs@student.cuk.ac.ke'),
      createdUsers.find(u => u.email === 'james.bit@student.cuk.ac.ke'),
      createdUsers.find(u => u.email === 'lisa.bbm@student.cuk.ac.ke'),
      createdUsers.find(u => u.email === 'kevin.cs@student.cuk.ac.ke')
    ];

    // Get candidates by position/department
    const candidatesByPosition = {
      president: createdCandidates.filter(c => c.position === 'President'),
      bitCongress: createdCandidates.filter(c => c.position === 'Congress Person' && c.department === 'BIT'),
      bbmCongress: createdCandidates.filter(c => c.position === 'Congress Person' && c.department === 'BBM'),
      csCongress: createdCandidates.filter(c => c.position === 'Congress Person' && c.department === 'CS'),
      bitMale: createdCandidates.filter(c => c.position === 'Male Delegate' && c.department === 'BIT'),
      bbmMale: createdCandidates.filter(c => c.position === 'Male Delegate' && c.department === 'BBM'),
      csMale: createdCandidates.filter(c => c.position === 'Male Delegate' && c.department === 'CS'),
      bitFemale: createdCandidates.filter(c => c.position === 'Female Delegate' && c.department === 'BIT'),
      bbmFemale: createdCandidates.filter(c => c.position === 'Female Delegate' && c.department === 'BBM'),
      csFemale: createdCandidates.filter(c => c.position === 'Female Delegate' && c.department === 'CS')
    };

    const votes = [];
    const electionId = createdElection[0]._id;

    // Create strategic votes showing competition
    // Student 1 (John - BIT student)
    if (candidatesByPosition.president[0]) votes.push({
      voterId: voters[0]._id,
      candidateId: candidatesByPosition.president[0]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.bitCongress[0]) votes.push({
      voterId: voters[0]._id,
      candidateId: candidatesByPosition.bitCongress[0]._id,
      position: 'Congress Person',
      department: 'BIT',
      electionId
    });
    if (candidatesByPosition.bitMale[0]) votes.push({
      voterId: voters[0]._id,
      candidateId: candidatesByPosition.bitMale[0]._id,
      position: 'Male Delegate',
      department: 'BIT',
      electionId
    });

    // Student 2 (Jane - BIT student)
    if (candidatesByPosition.president[1]) votes.push({
      voterId: voters[1]._id,
      candidateId: candidatesByPosition.president[1]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.bitCongress[1]) votes.push({
      voterId: voters[1]._id,
      candidateId: candidatesByPosition.bitCongress[1]._id,
      position: 'Congress Person',
      department: 'BIT',
      electionId
    });
    if (candidatesByPosition.bitFemale[0]) votes.push({
      voterId: voters[1]._id,
      candidateId: candidatesByPosition.bitFemale[0]._id,
      position: 'Female Delegate',
      department: 'BIT',
      electionId
    });

    // Student 3 (Bob - BBM student)
    if (candidatesByPosition.president[0]) votes.push({
      voterId: voters[2]._id,
      candidateId: candidatesByPosition.president[0]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.bbmCongress[0]) votes.push({
      voterId: voters[2]._id,
      candidateId: candidatesByPosition.bbmCongress[0]._id,
      position: 'Congress Person',
      department: 'BBM',
      electionId
    });
    if (candidatesByPosition.bbmMale[0]) votes.push({
      voterId: voters[2]._id,
      candidateId: candidatesByPosition.bbmMale[0]._id,
      position: 'Male Delegate',
      department: 'BBM',
      electionId
    });

    // Student 4 (Dave - CS student)
    if (candidatesByPosition.president[0]) votes.push({
      voterId: voters[3]._id,
      candidateId: candidatesByPosition.president[0]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.csCongress[0]) votes.push({
      voterId: voters[3]._id,
      candidateId: candidatesByPosition.csCongress[0]._id,
      position: 'Congress Person',
      department: 'CS',
      electionId
    });
    if (candidatesByPosition.csMale[0]) votes.push({
      voterId: voters[3]._id,
      candidateId: candidatesByPosition.csMale[0]._id,
      position: 'Male Delegate',
      department: 'CS',
      electionId
    });

    // Student 5 (James - BIT student)
    if (candidatesByPosition.president[1]) votes.push({
      voterId: voters[4]._id,
      candidateId: candidatesByPosition.president[1]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.bitCongress[0]) votes.push({
      voterId: voters[4]._id,
      candidateId: candidatesByPosition.bitCongress[0]._id,
      position: 'Congress Person',
      department: 'BIT',
      electionId
    });
    if (candidatesByPosition.bitMale[1]) votes.push({
      voterId: voters[4]._id,
      candidateId: candidatesByPosition.bitMale[1]._id,
      position: 'Male Delegate',
      department: 'BIT',
      electionId
    });

    // Student 6 (Lisa - BBM student)
    if (candidatesByPosition.president[0]) votes.push({
      voterId: voters[5]._id,
      candidateId: candidatesByPosition.president[0]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.bbmCongress[1]) votes.push({
      voterId: voters[5]._id,
      candidateId: candidatesByPosition.bbmCongress[1]._id,
      position: 'Congress Person',
      department: 'BBM',
      electionId
    });
    if (candidatesByPosition.bbmFemale[0]) votes.push({
      voterId: voters[5]._id,
      candidateId: candidatesByPosition.bbmFemale[0]._id,
      position: 'Female Delegate',
      department: 'BBM',
      electionId
    });

    // Student 7 (Kevin - CS student)
    if (candidatesByPosition.president[1]) votes.push({
      voterId: voters[6]._id,
      candidateId: candidatesByPosition.president[1]._id,
      position: 'President',
      department: null,
      electionId
    });
    if (candidatesByPosition.csCongress[1]) votes.push({
      voterId: voters[6]._id,
      candidateId: candidatesByPosition.csCongress[1]._id,
      position: 'Congress Person',
      department: 'CS',
      electionId
    });
    if (candidatesByPosition.csFemale[0]) votes.push({
      voterId: voters[6]._id,
      candidateId: candidatesByPosition.csFemale[0]._id,
      position: 'Female Delegate',
      department: 'CS',
      electionId
    });

    const createdVotes = await Vote.insertMany(votes);
    console.log(`Created ${createdVotes.length} votes`);

    // Update candidate vote counts
    console.log('Updating candidate vote counts...');
    for (const candidate of createdCandidates) {
      const voteCount = await Vote.countDocuments({ candidateId: candidate._id });
      await Candidate.findByIdAndUpdate(candidate._id, { votes: voteCount });
    }

    // Update election stats using findByIdAndUpdate to avoid hook issues
    await Election.findByIdAndUpdate(createdElection[0]._id, { totalVotes: createdVotes.length });

    // Update user voted status for all voters
    for (const voter of voters) {
      const userVotes = await Vote.find({ voterId: voter._id });
      if (userVotes.length > 0) {
        await createdUsers.find(u => u._id.toString() === voter._id.toString()).updateOne({
          hasVoted: true,
          votedPositions: [...new Set(userVotes.map(v => v.position))]
        });
      }
    }

    // Re-fetch and save voters to ensure they're marked as voted
    for (const voterId of voters.map(v => v._id)) {
      const userVotes = await Vote.find({ voterId });
      if (userVotes.length > 0) {
        await User.findByIdAndUpdate(voterId, {
          hasVoted: true,
          votedPositions: [...new Set(userVotes.map(v => v.position))]
        });
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Candidates: ${createdCandidates.length}`);
    console.log(`   - Elections: ${createdElection.length}`);
    console.log(`   - Votes: ${createdVotes.length}`);

    // Print test credentials
    console.log('\n🔐 Test Credentials:');
    console.log('   Admin: admin@student.cuk.ac.ke (any reg number with ADMIN/)');
    console.log('   Student: john.bit@student.cuk.ac.ke (BIT/2023/10001)');
    console.log('   Aspirant: alice.bit@student.cuk.ac.ke (BIT/2022/10003)');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

// Run seeder
connectDB().then(() => seedDatabase());
