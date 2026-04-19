/**
 * Database Seeder for CoopVotes
 * Run with: npm run seed
 * Includes comprehensive data from ALL departments: BIT, BBM, CS, COMM, LAW, EDU
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const Vote = require('../models/Vote');

// Load env vars
dotenv.config();

// Comprehensive sample data with all departments
const users = [
  { email: 'admin@student.cuk.ac.ke', regNumber: 'C032/000001/2024', department: 'ADMIN', yearOfStudy: 1, admissionYear: 2024, role: 'admin', hasVoted: false, votedPositions: [] },
  // BIT Students
  { email: 'john.bit@student.cuk.ac.ke', regNumber: 'C026/405411/2023', department: 'BIT', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'jane.bit@student.cuk.ac.ke', regNumber: 'C026/405412/2023', department: 'BIT', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'james.bit@student.cuk.ac.ke', regNumber: 'C026/405418/2023', department: 'BIT', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'jacob.bit@student.cuk.ac.ke', regNumber: 'C026/405419/2023', department: 'BIT', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'jessica.bit@student.cuk.ac.ke', regNumber: 'C026/405420/2023', department: 'BIT', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  // BIT Aspirants (Congress, Delegates, President)
  { email: 'alice.bit@student.cuk.ac.ke', regNumber: 'C026/405413/2022', department: 'BIT', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'mark.bit@student.cuk.ac.ke', regNumber: 'C026/405416/2022', department: 'BIT', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'peter.bit@student.cuk.ac.ke', regNumber: 'C026/405417/2023', department: 'BIT', yearOfStudy: 2, admissionYear: 2023, role: 'aspirant', hasVoted: false, votedPositions: [] },
  // BBM Students
  { email: 'bob.bbm@student.cuk.ac.ke', regNumber: 'C027/505411/2023', department: 'BBM', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'beatrice.bbm@student.cuk.ac.ke', regNumber: 'C027/505416/2023', department: 'BBM', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'benjamin.bbm@student.cuk.ac.ke', regNumber: 'C027/505417/2023', department: 'BBM', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'bella.bbm@student.cuk.ac.ke', regNumber: 'C027/505418/2023', department: 'BBM', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'lisa.bbm@student.cuk.ac.ke', regNumber: 'C027/505415/2023', department: 'BBM', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  // BBM Aspirants
  { email: 'carol.bbm@student.cuk.ac.ke', regNumber: 'C027/505412/2023', department: 'BBM', yearOfStudy: 2, admissionYear: 2023, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'brian.bbm@student.cuk.ac.ke', regNumber: 'C027/505413/2022', department: 'BBM', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'sophia.bbm@student.cuk.ac.ke', regNumber: 'C027/505414/2023', department: 'BBM', yearOfStudy: 2, admissionYear: 2023, role: 'aspirant', hasVoted: false, votedPositions: [] },
  // CS Students
  { email: 'dave.cs@student.cuk.ac.ke', regNumber: 'C028/605411/2023', department: 'CS', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'diana.cs@student.cuk.ac.ke', regNumber: 'C028/605414/2023', department: 'CS', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'david.cs@student.cuk.ac.ke', regNumber: 'C028/605419/2023', department: 'CS', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'deborah.cs@student.cuk.ac.ke', regNumber: 'C028/605420/2023', department: 'CS', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'kevin.cs@student.cuk.ac.ke', regNumber: 'C028/605415/2023', department: 'CS', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  // CS Aspirants
  { email: 'eve.cs@student.cuk.ac.ke', regNumber: 'C028/605412/2022', department: 'CS', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'grace.cs@student.cuk.ac.ke', regNumber: 'C028/605413/2022', department: 'CS', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  // COMM Students
  { email: 'charles.comm@student.cuk.ac.ke', regNumber: 'C029/705411/2023', department: 'COMM', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'claire.comm@student.cuk.ac.ke', regNumber: 'C029/705412/2023', department: 'COMM', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'chris.comm@student.cuk.ac.ke', regNumber: 'C029/705413/2023', department: 'COMM', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'charlotte.comm@student.cuk.ac.ke', regNumber: 'C029/705414/2023', department: 'COMM', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  // COMM Aspirants
  { email: 'henry.comm@student.cuk.ac.ke', regNumber: 'C029/705415/2022', department: 'COMM', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'hannah.comm@student.cuk.ac.ke', regNumber: 'C029/705416/2022', department: 'COMM', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  // LAW Students
  { email: 'leo.law@student.cuk.ac.ke', regNumber: 'C030/805411/2023', department: 'LAW', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'lucy.law@student.cuk.ac.ke', regNumber: 'C030/805412/2023', department: 'LAW', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'liam.law@student.cuk.ac.ke', regNumber: 'C030/805413/2023', department: 'LAW', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'lily.law@student.cuk.ac.ke', regNumber: 'C030/805414/2023', department: 'LAW', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  // LAW Aspirants
  { email: 'oliver.law@student.cuk.ac.ke', regNumber: 'C030/805415/2022', department: 'LAW', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'olivia.law@student.cuk.ac.ke', regNumber: 'C030/805416/2022', department: 'LAW', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  // EDU Students
  { email: 'peter.edu@student.cuk.ac.ke', regNumber: 'C031/905411/2023', department: 'EDU', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'patricia.edu@student.cuk.ac.ke', regNumber: 'C031/905412/2023', department: 'EDU', yearOfStudy: 2, admissionYear: 2023, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'paul.edu@student.cuk.ac.ke', regNumber: 'C031/905413/2023', department: 'EDU', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  { email: 'paula.edu@student.cuk.ac.ke', regNumber: 'C031/905414/2023', department: 'EDU', yearOfStudy: 1, admissionYear: 2025, role: 'student', hasVoted: false, votedPositions: [] },
  // EDU Aspirants
  { email: 'michael.edu@student.cuk.ac.ke', regNumber: 'C031/905415/2022', department: 'EDU', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'michelle.edu@student.cuk.ac.ke', regNumber: 'C031/905416/2022', department: 'EDU', yearOfStudy: 3, admissionYear: 2022, role: 'aspirant', hasVoted: false, votedPositions: [] },
  // President Aspirants (One from each dept)
  { email: 'president@student.cuk.ac.ke', regNumber: 'C026/405414/2021', department: 'BIT', yearOfStudy: 4, admissionYear: 2021, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'janet.bit@student.cuk.ac.ke', regNumber: 'C026/405415/2021', department: 'BIT', yearOfStudy: 4, admissionYear: 2021, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'rachel.bbm@student.cuk.ac.ke', regNumber: 'C027/505420/2021', department: 'BBM', yearOfStudy: 4, admissionYear: 2021, role: 'aspirant', hasVoted: false, votedPositions: [] },
  { email: 'richard.cs@student.cuk.ac.ke', regNumber: 'C028/605421/2021', department: 'CS', yearOfStudy: 4, admissionYear: 2021, role: 'aspirant', hasVoted: false, votedPositions: [] }
];

// Election data with positions for all departments
const elections = [
  {
    name: 'Student Government Election 2026',
    year: 2026,
    isActive: true,
    status: 'active',
    startTime: new Date(),
    totalVoters: users.filter(u => u.role === 'student').length,
    totalVotes: 0,
    positions: [
      { name: 'President', department: null },
      { name: 'Congress Person', department: 'BIT' },
      { name: 'Congress Person', department: 'BBM' },
      { name: 'Congress Person', department: 'CS' },
      { name: 'Congress Person', department: 'COMM' },
      { name: 'Congress Person', department: 'LAW' },
      { name: 'Congress Person', department: 'EDU' },
      { name: 'Male Delegate', department: 'BIT' },
      { name: 'Male Delegate', department: 'BBM' },
      { name: 'Male Delegate', department: 'CS' },
      { name: 'Male Delegate', department: 'COMM' },
      { name: 'Male Delegate', department: 'LAW' },
      { name: 'Male Delegate', department: 'EDU' },
      { name: 'Female Delegate', department: 'BIT' },
      { name: 'Female Delegate', department: 'BBM' },
      { name: 'Female Delegate', department: 'CS' },
      { name: 'Female Delegate', department: 'COMM' },
      { name: 'Female Delegate', department: 'LAW' },
      { name: 'Female Delegate', department: 'EDU' }
    ]
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');
  } catch (error) {
    console.error('❌ DB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await Candidate.deleteMany({});
    await Election.deleteMany({});
    await Vote.deleteMany({});

    console.log('✓ Cleared old data');

    console.log('\nInserting users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✓ Created ${createdUsers.length} users`);

    const adminUser = createdUsers.find(u => u.role === 'admin');

    console.log('\nCreating candidates...');
    const candidates = [
      // PRESIDENTS
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
      {
        userId: createdUsers.find(u => u.email === 'rachel.bbm@student.cuk.ac.ke')._id,
        position: 'President',
        department: null,
        manifesto: 'Student welfare first! I will advocate for affordable accommodation and better meals.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'richard.cs@student.cuk.ac.ke')._id,
        position: 'President',
        department: null,
        manifesto: 'Innovation, inclusion, and integrity! Together we\'ll build an outstanding community.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=richard',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      // CONGRESS
      {
        userId: createdUsers.find(u => u.email === 'alice.bit@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BIT',
        manifesto: 'BIT students deserve better labs and industry connections.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'mark.bit@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BIT',
        manifesto: 'Let\'s revolutionize BIT with cutting-edge facilities and partnerships.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mark',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'carol.bbm@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BBM',
        manifesto: 'BBM students need real-world exposure and company visits.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'brian.bbm@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'BBM',
        manifesto: 'Building careers and networks for BBM students.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brian',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'eve.cs@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'CS',
        manifesto: 'Code the future! More hackathons and 24/7 lab access.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'grace.cs@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'CS',
        manifesto: 'CS is the hub of innovation and creativity.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'henry.comm@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'COMM',
        manifesto: 'Communication is key! Better media labs and industry partnerships.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'hannah.comm@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'COMM',
        manifesto: 'Your voice matters! Advocating for COMM students.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hannah',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'oliver.law@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'LAW',
        manifesto: 'Justice and equality! Better library resources and moot courts.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oliver',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'olivia.law@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'LAW',
        manifesto: 'Legal excellence for all law students.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'michael.edu@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'EDU',
        manifesto: 'Teaching excellence! Better resources and mentorship.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'michelle.edu@student.cuk.ac.ke')._id,
        position: 'Congress Person',
        department: 'EDU',
        manifesto: 'Supporting EDU students with the best opportunities.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michelle',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      // MALE DELEGATES
      {
        userId: createdUsers.find(u => u.email === 'john.bit@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BIT',
        manifesto: 'Your voice in student council. Representing BIT males.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'peter.bit@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BIT',
        manifesto: 'Supporting BIT male students and their needs.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peter',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'bob.bbm@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BBM',
        manifesto: 'Representing BBM males with pride and commitment.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'benjamin.bbm@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'BBM',
        manifesto: 'Your support helps me serve BBM males better.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=benjamin',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'dave.cs@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'CS',
        manifesto: 'Working for CS male students. Your support fuels my drive!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'chris.comm@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'COMM',
        manifesto: 'Amplifying COMM male student voices.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'liam.law@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'LAW',
        manifesto: 'Justice for all! Representing LAW males.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liam',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'paul.edu@student.cuk.ac.ke')._id,
        position: 'Male Delegate',
        department: 'EDU',
        manifesto: 'Supporting EDU male students in their journey.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=paul',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      // FEMALE DELEGATES
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
      {
        userId: createdUsers.find(u => u.email === 'jessica.bit@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'BIT',
        manifesto: 'Together we rise! Supporting all BIT females.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'beatrice.bbm@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'BBM',
        manifesto: 'Championing women\'s equality in business education.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=beatrice',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'sophia.bbm@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'BBM',
        manifesto: 'BBM female students deserve the best.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'diana.cs@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'CS',
        manifesto: 'Building community for women in computing.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'deborah.cs@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'CS',
        manifesto: 'Women in CS - we are strong and brilliant!',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=deborah',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'claire.comm@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'COMM',
        manifesto: 'Voices of COMM women - heard and valued.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=claire',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'charlotte.comm@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'COMM',
        manifesto: 'Supporting COMM female students.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlotte',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'lucy.law@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'LAW',
        manifesto: 'Justice and equality for LAW females.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucy',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'lily.law@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'LAW',
        manifesto: 'Advocating for LAW females with strength.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lily',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'patricia.edu@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'EDU',
        manifesto: 'Education and empowerment for EDU females.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=patricia',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        userId: createdUsers.find(u => u.email === 'paula.edu@student.cuk.ac.ke')._id,
        position: 'Female Delegate',
        department: 'EDU',
        manifesto: 'Women educators of tomorrow - inspiring each other.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=paula',
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      }
    ];

    const createdCandidates = await Candidate.insertMany(candidates);
    console.log(`✓ Created ${createdCandidates.length} candidates`);

    console.log('\nCreating election...');
    const createdElection = await Election.insertMany(elections);
    console.log(`✓ Created election: ${createdElection[0].name}`);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total Users: ${String(createdUsers.length).padEnd(39)}║`);
    console.log(`║   - Students (Voters): ${String(createdUsers.filter(u => u.role === 'student').length).padEnd(31)}║`);
    console.log(`║   - Aspirants (Candidates): ${String(createdUsers.filter(u => u.role === 'aspirant').length).padEnd(26)}║`);
    console.log(`║   - Admin: ${String(createdUsers.filter(u => u.role === 'admin').length).padEnd(42)}║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total Candidates: ${String(createdCandidates.length).padEnd(36)}║`);
    console.log('║ Coverage:                                              ║');
    console.log('║   ✓ President (Common): 4 candidates                   ║');
    console.log('║   ✓ Congress: 2 per department × 6 = 12               ║');
    console.log('║   ✓ Male Delegate: 1-2 per department = 8             ║');
    console.log('║   ✓ Female Delegate: 1-2 per department = 8           ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║ All 6 Departments Included:                            ║');
    console.log('║   • BIT (Bachelor of Information Technology)           ║');
    console.log('║   • BBM (Bachelor of Business Management)              ║');
    console.log('║   • CS (Computer Science)                              ║');
    console.log('║   • COMM (Communication)                               ║');
    console.log('║   • LAW (Law)                                          ║');
    console.log('║   • EDU (Education)                                    ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║ TEST LOGIN CREDENTIALS:                                ║');
    console.log('║                                                        ║');
    console.log('║ Admin Account:                                         ║');
    console.log('║   Email: admin@student.cuk.ac.ke                       ║');
    console.log('║   Reg#:  C032/000001/2024                              ║');
    console.log('║                                                        ║');
    console.log('║ Sample Students:                                       ║');
    console.log('║   john.bit@student.cuk.ac.ke  (BIT)                    ║');
    console.log('║   bob.bbm@student.cuk.ac.ke   (BBM)                    ║');
    console.log('║   dave.cs@student.cuk.ac.ke   (CS)                     ║');
    console.log('║   charles.comm@student.cuk.ac.ke (COMM)                ║');
    console.log('║   leo.law@student.cuk.ac.ke   (LAW)                    ║');
    console.log('║   peter.edu@student.cuk.ac.ke (EDU)                    ║');
    console.log('║                                                        ║');
    console.log('║ Password: Use your registration number                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    console.log('\n✨ Database ready! Starting app with: npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed Error:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedDatabase());

