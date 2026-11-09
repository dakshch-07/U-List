import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Category, ICategoryField } from '../models/Category';
import { Ad } from '../models/Ad';
import { City, Banner, Page, Setting } from '../models/Extras';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CATEGORIES_DATA: {
  name: string;
  slug: string;
  icon: string;
  priceMode: 'price' | 'salary' | 'rent';
  fields: ICategoryField[];
  subcategories: { name: string; slug: string; fields?: ICategoryField[] }[];
}[] = [
  {
    name: 'Cars',
    slug: 'cars',
    icon: 'car-outline',
    priceMode: 'price',
    fields: [
      {
        label: 'Brand',
        key: 'brand',
        type: 'select',
        options: [
          'Maruti Suzuki',
          'Hyundai',
          'Tata',
          'Mahindra',
          'Honda',
          'Toyota',
          'Kia',
          'Renault',
          'Ford',
          'Volkswagen',
          'Others',
        ],
        required: true,
        filterable: true,
      },
      { label: 'Model', key: 'model', type: 'text', required: true, filterable: false },
      { label: 'Variant', key: 'variant', type: 'text', required: false, filterable: false },
      { label: 'Year', key: 'year', type: 'number', required: true, filterable: true },
      {
        label: 'Fuel',
        key: 'fuel',
        type: 'select',
        options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'LPG'],
        required: true,
        filterable: true,
      },
      {
        label: 'Transmission',
        key: 'transmission',
        type: 'select',
        options: ['Manual', 'Automatic'],
        required: true,
        filterable: true,
      },
      { label: 'KM driven', key: 'km_driven', type: 'number', required: true, filterable: true },
      {
        label: 'No. of owners',
        key: 'owners',
        type: 'select',
        options: ['1', '2', '3', '4+'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [{ name: 'Cars', slug: 'cars-sub' }],
  },
  {
    name: 'Properties',
    slug: 'properties',
    icon: 'home-city-outline',
    priceMode: 'price',
    fields: [
      {
        label: 'Type',
        key: 'property_type',
        type: 'select',
        options: ['Apartment', 'Independent House', 'Builder Floor', 'Villa', 'Plot'],
        required: true,
        filterable: true,
      },
      {
        label: 'Bedrooms',
        key: 'bedrooms',
        type: 'select',
        options: ['1', '2', '3', '4+'],
        required: true,
        filterable: true,
      },
      { label: 'Bathrooms', key: 'bathrooms', type: 'number', required: false, filterable: false },
      {
        label: 'Furnishing',
        key: 'furnishing',
        type: 'select',
        options: ['Furnished', 'Semi-furnished', 'Unfurnished'],
        required: true,
        filterable: true,
      },
      { label: 'Built-up area (sq ft)', key: 'area_sqft', type: 'number', required: true, filterable: true },
      { label: 'Floor', key: 'floor', type: 'text', required: false, filterable: false },
      { label: 'Facing', key: 'facing', type: 'text', required: false, filterable: false },
      {
        label: 'Listed by',
        key: 'listed_by',
        type: 'select',
        options: ['Owner', 'Dealer', 'Builder'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [
      { name: 'Houses & Apartments For Sale', slug: 'prop-sale-houses' },
      { name: 'Land & Plots', slug: 'prop-sale-land' },
      { name: 'Shops & Offices For Sale', slug: 'prop-sale-shops' },
      { name: 'Houses & Apartments For Rent', slug: 'prop-rent-houses' },
      { name: 'Shops & Offices For Rent', slug: 'prop-rent-shops' },
      { name: 'PG & Guest Houses', slug: 'prop-rent-pg' },
    ],
  },
  {
    name: 'Mobiles',
    slug: 'mobiles',
    icon: 'cellphone',
    priceMode: 'price',
    fields: [
      {
        label: 'Brand',
        key: 'brand',
        type: 'select',
        options: [
          'Apple',
          'Samsung',
          'Xiaomi',
          'Redmi',
          'Vivo',
          'Oppo',
          'OnePlus',
          'Realme',
          'Motorola',
          'Others',
        ],
        required: true,
        filterable: true,
      },
      { label: 'Model', key: 'model', type: 'text', required: true, filterable: false },
      { label: 'Storage', key: 'storage', type: 'text', required: true, filterable: true },
      { label: 'RAM', key: 'ram', type: 'text', required: false, filterable: false },
      {
        label: 'Condition',
        key: 'condition',
        type: 'select',
        options: ['Brand New', 'Like New', 'Used', 'Refurbished'],
        required: true,
        filterable: true,
      },
      { label: 'Warranty', key: 'warranty', type: 'text', required: false, filterable: false },
    ],
    subcategories: [
      { name: 'Mobile Phones', slug: 'mobile-phones' },
      { name: 'Accessories', slug: 'mobile-accessories' },
      { name: 'Tablets', slug: 'tablets' },
    ],
  },
  {
    name: 'Jobs',
    slug: 'jobs',
    icon: 'briefcase-outline',
    priceMode: 'salary',
    fields: [
      { label: 'Salary from', key: 'salary_from', type: 'number', required: true, filterable: true },
      { label: 'Salary to', key: 'salary_to', type: 'number', required: true, filterable: true },
      {
        label: 'Salary period',
        key: 'salary_period',
        type: 'select',
        options: ['Monthly', 'Weekly', 'Hourly'],
        required: true,
        filterable: true,
      },
      {
        label: 'Position type',
        key: 'position_type',
        type: 'select',
        options: ['Full-time', 'Part-time', 'Contract', 'Temporary'],
        required: true,
        filterable: true,
      },
      { label: 'Experience', key: 'experience', type: 'text', required: true, filterable: false },
    ],
    subcategories: [
      { name: 'Data entry and back office', slug: 'job-data-entry' },
      { name: 'Sales and marketing', slug: 'job-sales' },
      { name: 'BPO and telecaller', slug: 'job-bpo' },
      { name: 'Driver', slug: 'job-driver' },
      { name: 'Office assistant', slug: 'job-office-assistant' },
      { name: 'Delivery', slug: 'job-delivery' },
      { name: 'Teacher', slug: 'job-teacher' },
      { name: 'Cook', slug: 'job-cook' },
      { name: 'Receptionist and front office', slug: 'job-receptionist' },
      { name: 'Operator and technician', slug: 'job-technician' },
      { name: 'IT engineer', slug: 'job-it' },
      { name: 'Hotel and travel executive', slug: 'job-hotel' },
      { name: 'Accountant', slug: 'job-accountant' },
      { name: 'Designer', slug: 'job-designer' },
      { name: 'Other jobs', slug: 'job-other' },
    ],
  },
  {
    name: 'Bikes',
    slug: 'bikes',
    icon: 'motorbike',
    priceMode: 'price',
    fields: [
      {
        label: 'Brand',
        key: 'brand',
        type: 'select',
        options: ['Hero', 'Honda', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM', 'Others'],
        required: true,
        filterable: true,
      },
      { label: 'Model', key: 'model', type: 'text', required: true, filterable: false },
      { label: 'Year', key: 'year', type: 'number', required: true, filterable: true },
      { label: 'KM driven', key: 'km_driven', type: 'number', required: true, filterable: true },
      {
        label: 'No. of owners',
        key: 'owners',
        type: 'select',
        options: ['1', '2', '3', '4+'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [
      { name: 'Motorcycles', slug: 'motorcycles' },
      { name: 'Scooters', slug: 'scooters' },
      { name: 'Spare parts', slug: 'bike-spare-parts' },
      { name: 'Bicycles', slug: 'bicycles' },
    ],
  },
  {
    name: 'Electronics & Appliances',
    slug: 'electronics',
    icon: 'television',
    priceMode: 'price',
    fields: [
      { label: 'Brand', key: 'brand', type: 'text', required: true, filterable: true },
      {
        label: 'Condition',
        key: 'condition',
        type: 'select',
        options: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'],
        required: true,
        filterable: true,
      },
      { label: 'Years used', key: 'years_used', type: 'number', required: false, filterable: false },
      { label: 'Warranty', key: 'warranty', type: 'text', required: false, filterable: false },
    ],
    subcategories: [
      { name: 'TVs and audio', slug: 'tvs-audio' },
      { name: 'Computers and laptops', slug: 'computers-laptops' },
      { name: 'Computer accessories', slug: 'computer-accessories' },
      { name: 'Cameras and lenses', slug: 'cameras-lenses' },
      { name: 'Kitchen appliances', slug: 'kitchen-appliances' },
      { name: 'Refrigerators', slug: 'refrigerators' },
      { name: 'Washing machines', slug: 'washing-machines' },
      { name: 'Air conditioners', slug: 'air-conditioners' },
      { name: 'Games and entertainment', slug: 'games-entertainment' },
      { name: 'Other', slug: 'electronics-other' },
    ],
  },
  {
    name: 'Commercial Vehicles & Spares',
    slug: 'commercial-vehicles',
    icon: 'truck-outline',
    priceMode: 'price',
    fields: [
      { label: 'Type', key: 'vehicle_type', type: 'text', required: true, filterable: true },
      { label: 'Brand', key: 'brand', type: 'text', required: true, filterable: true },
      { label: 'Year', key: 'year', type: 'number', required: true, filterable: true },
    ],
    subcategories: [
      { name: 'Commercial and other vehicles', slug: 'commercial-vehicles-sub' },
      { name: 'Spare parts', slug: 'commercial-spares' },
    ],
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    icon: 'sofa-outline',
    priceMode: 'price',
    fields: [
      { label: 'Material', key: 'material', type: 'text', required: false, filterable: true },
      {
        label: 'Condition',
        key: 'condition',
        type: 'select',
        options: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [
      { name: 'Sofa and dining', slug: 'sofa-dining' },
      { name: 'Beds and wardrobes', slug: 'beds-wardrobes' },
      { name: 'Home decor and garden', slug: 'home-decor' },
      { name: 'Kids furniture', slug: 'kids-furniture' },
      { name: 'Other household items', slug: 'household-other' },
    ],
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: 'tshirt-crew-outline',
    priceMode: 'price',
    fields: [
      { label: 'Type', key: 'type', type: 'text', required: true, filterable: true },
      { label: 'Size', key: 'size', type: 'text', required: false, filterable: true },
      {
        label: 'Condition',
        key: 'condition',
        type: 'select',
        options: ['New with tags', 'New without tags', 'Used - Good'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [
      { name: 'Men', slug: 'fashion-men' },
      { name: 'Women', slug: 'fashion-women' },
      { name: 'Kids', slug: 'fashion-kids' },
    ],
  },
  {
    name: 'Books, Sports & Hobbies',
    slug: 'books-sports',
    icon: 'basketball',
    priceMode: 'price',
    fields: [
      {
        label: 'Condition',
        key: 'condition',
        type: 'select',
        options: ['New', 'Used - Like New', 'Used - Good'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [
      { name: 'Books', slug: 'books' },
      { name: 'Gym and fitness', slug: 'gym-fitness' },
      { name: 'Musical instruments', slug: 'musical-instruments' },
      { name: 'Sports equipment', slug: 'sports-equipment' },
      { name: 'Other hobbies', slug: 'other-hobbies' },
    ],
  },
  {
    name: 'Pets',
    slug: 'pets',
    icon: 'dog',
    priceMode: 'price',
    fields: [
      { label: 'Breed', key: 'breed', type: 'text', required: true, filterable: true },
      { label: 'Age', key: 'age', type: 'text', required: false, filterable: false },
    ],
    subcategories: [
      { name: 'Dogs', slug: 'dogs' },
      { name: 'Cats', slug: 'cats' },
      { name: 'Fish and aquarium', slug: 'fish-aquarium' },
      { name: 'Birds', slug: 'birds' },
      { name: 'Pet food and accessories', slug: 'pet-food' },
      { name: 'Other pets', slug: 'other-pets' },
    ],
  },
  {
    name: 'Services',
    slug: 'services',
    icon: 'tools',
    priceMode: 'price',
    fields: [
      { label: 'Service type', key: 'service_type', type: 'text', required: true, filterable: true },
      {
        label: 'Price type',
        key: 'price_type',
        type: 'select',
        options: ['Fixed', 'Per hour', 'Negotiable'],
        required: true,
        filterable: true,
      },
    ],
    subcategories: [
      { name: 'Education and classes', slug: 'service-education' },
      { name: 'Tours and travel', slug: 'service-travel' },
      { name: 'Electronics repair', slug: 'service-repair' },
      { name: 'Health and beauty', slug: 'service-beauty' },
      { name: 'Home renovation and repair', slug: 'service-renovation' },
      { name: 'Cleaning and pest control', slug: 'service-cleaning' },
      { name: 'Legal and documentation', slug: 'service-legal' },
      { name: 'Packers and movers', slug: 'service-packers' },
      { name: 'Other services', slug: 'service-other' },
    ],
  },
];

const CITIES_DATA = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
];

const DEMO_ADS_SPEC = [
  {
    cat: 'cars',
    title: 'Maruti Suzuki Swift VXi 2021, Single Owner, Mint Condition',
    desc: 'Very well maintained, single owner driven, genuine showroom service record. Insurance valid till Oct 2027.',
    price: 540000,
    city: 'Mumbai',
    locality: 'Andheri West',
    attrs: { brand: 'Maruti Suzuki', year: 2021, fuel: 'Petrol', transmission: 'Manual', km_driven: 24000, owners: '1' },
    isFeatured: true,
    img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'properties',
    title: '2 BHK flat for sale in prime location with reserved parking',
    desc: 'Spacious 950 sqft carpet area, east facing, 4th floor out of 12. Gated society with gym, club house and 24x7 security.',
    price: 8500000,
    city: 'Bengaluru',
    locality: 'Whitefield',
    attrs: { property_type: 'Apartment', bedrooms: '2', area_sqft: 950, furnishing: 'Semi-furnished', listed_by: 'Owner' },
    isFeatured: true,
    img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'mobiles',
    title: 'iPhone 14 Pro 128GB Space Black with bill and box',
    desc: 'Battery health 88%, zero scratches, tempered glass and Spigen cover since day one. Indian bill included.',
    price: 68000,
    city: 'Delhi',
    locality: 'Connaught Place',
    attrs: { brand: 'Apple', model: 'iPhone 14 Pro', storage: '128GB', condition: 'Like New' },
    isFeatured: true,
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'jobs',
    title: 'Urgent hiring: Telecaller and Back Office Executive',
    desc: 'Looking for enthusiastic executives for inbound support. Freshers and experienced candidates welcome. Good English and Hindi communication required.',
    price: 0,
    salary: { from: 18000, to: 25000, period: 'Monthly' },
    city: 'Pune',
    locality: 'Viman Nagar',
    attrs: { salary_from: 18000, salary_to: 25000, salary_period: 'Monthly', position_type: 'Full-time', experience: '0-2 years' },
    isFeatured: true,
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'bikes',
    title: 'Royal Enfield Classic 350 Reborn 2022, 14000 km',
    desc: 'Gunmetal grey with dual channel ABS. Crash guard and touring seat installed. Regularly serviced at authorized RE service center.',
    price: 175000,
    city: 'Hyderabad',
    locality: 'Banjara Hills',
    attrs: { brand: 'Royal Enfield', model: 'Classic 350', year: 2022, km_driven: 14000, owners: '1' },
    isFeatured: true,
    img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'electronics',
    title: 'Sony Bravia 55 inch 4K Ultra HD Smart Google TV',
    desc: 'Purchased in late 2023, wall mounted since purchase, crystal clear display, Dolby Atmos sound. Selling due to relocation.',
    price: 42000,
    city: 'Mumbai',
    locality: 'Bandra West',
    attrs: { brand: 'Sony', condition: 'Used - Like New', years_used: 1 },
    isFeatured: true,
    img: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'commercial-vehicles',
    title: 'Tata Ace Gold BS6 Mini Truck 2021, Excellent Condition',
    desc: 'Diesel high mileage commercial vehicle, single hand driven with valid fitness certificate and national permit.',
    price: 360000,
    city: 'Ahmedabad',
    locality: 'Naroda GIDC',
    attrs: { vehicle_type: 'Mini Truck', brand: 'Tata', year: 2021 },
    isFeatured: false,
    img: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'furniture',
    title: 'Solid Sheesham wood 6 seater dining table with cushioned chairs',
    desc: 'Pure handcrafted Sheesham wood with glass top. Extremely sturdy and without any damage.',
    price: 24000,
    city: 'Bengaluru',
    locality: 'Indiranagar',
    attrs: { material: 'Sheesham Wood', condition: 'Used - Like New' },
    isFeatured: false,
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'fashion',
    title: 'Men Designer Embroidered Kurta Pajama Set (Size 40)',
    desc: 'Silk blend premium festival kurta set worn only once for wedding. Dry cleaned and ready to wear.',
    price: 2800,
    city: 'Jaipur',
    locality: 'C-Scheme',
    attrs: { type: 'Ethnic Wear', size: '40 / L', condition: 'Used - Good' },
    isFeatured: false,
    img: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'books-sports',
    title: 'Decathlon Triban RC 100 Road Bike with Helmet & Lock',
    desc: 'Barely used road bicycle with 7 speed Shimano gears, 700c wheels, lightweight aluminium frame.',
    price: 13500,
    city: 'Chandigarh',
    locality: 'Sector 17',
    attrs: { condition: 'Used - Like New' },
    isFeatured: false,
    img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'pets',
    title: 'Golden Retriever Puppies (55 Days Old) Vaccinated & Dewormed',
    desc: 'Active, healthy KCI registered purebred Golden Retriever litter. First vaccination completed with vet booklet.',
    price: 18000,
    city: 'Delhi',
    locality: 'Dwarka Sector 10',
    attrs: { breed: 'Golden Retriever', age: '55 Days' },
    isFeatured: false,
    img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
  },
  {
    cat: 'services',
    title: 'Professional Home Deep Cleaning & Pest Control Services',
    desc: 'Complete kitchen, bathroom and sofa sanitization with mechanized single disc machine by verified staff.',
    price: 2499,
    city: 'Mumbai',
    locality: 'Thane West',
    attrs: { service_type: 'Cleaning & Sanitization', price_type: 'Fixed' },
    isFeatured: false,
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  },
];

// Placeholder image (neutral 4:3 SVG converted into data URI or local placeholder)
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

export async function runSeed(): Promise<void> {
  console.log('[Seed] Starting database seed...');
  await connectDB();

  // Clear existing data for clean baseline
  await Promise.all([
    Category.deleteMany({}),
    City.deleteMany({}),
    Banner.deleteMany({}),
    Page.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  // Seed Admin user
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ulist.in').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminUlist#2026', 10);
    admin = await User.create({
      name: 'Ulist Administrator',
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '+919876543210',
      passwordHash,
      role: 'admin',
      status: 'active',
    });
    console.log('[Seed] Admin user created:', adminEmail);
  }

  // Seed standard demo users
  const demoUsers: any[] = [];
  const demoUserProfiles = [
    { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+919820123456' },
    { name: 'Priya Patel', email: 'priya@example.com', phone: '+919879012345' },
    { name: 'Amit Verma', email: 'amit@example.com', phone: '+919811234567' },
    { name: 'Sneha Reddy', email: 'sneha@example.com', phone: '+919848012345' },
  ];

  const defaultHash = await bcrypt.hash('Password#123', 10);
  for (const prof of demoUserProfiles) {
    let u = await User.findOne({ email: prof.email });
    if (!u) {
      u = await User.create({
        ...prof,
        passwordHash: defaultHash,
        role: 'user',
        status: 'active',
      });
    }
    demoUsers.push(u);
  }

  // Seed Categories & Subcategories
  const categoryMap = new Map<string, any>();
  let catOrder = 1;

  for (const catData of CATEGORIES_DATA) {
    const topCat = await Category.create({
      name: catData.name,
      slug: catData.slug,
      icon: catData.icon,
      order: catOrder++,
      priceMode: catData.priceMode,
      fields: catData.fields,
      isActive: true,
      parent: null,
    });
    categoryMap.set(catData.slug, topCat);

    if (catData.subcategories && catData.subcategories.length > 0) {
      for (const sub of catData.subcategories) {
        await Category.create({
          name: sub.name,
          slug: sub.slug,
          icon: catData.icon,
          parent: topCat._id,
          order: 0,
          isActive: true,
          fields: sub.fields || catData.fields,
          priceMode: catData.priceMode,
        });
      }
    }
  }
  console.log(`[Seed] Seeded ${CATEGORIES_DATA.length} categories with subcategories & attribute configurations`);

  // Seed Cities
  await City.insertMany(CITIES_DATA);
  console.log(`[Seed] Seeded ${CITIES_DATA.length} Indian cities`);

  // Seed Banners
  await Banner.insertMany([
    {
      title: 'Buy & Sell Fast in your Neighbourhood',
      imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80',
      order: 1,
      isActive: true,
    },
    {
      title: 'Verified Pre-Owned Cars with Inspection',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      order: 2,
      isActive: true,
    },
  ]);

  // Seed Pages
  await Page.insertMany([
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      content: 'Ulist takes your privacy seriously. We collect contact details strictly to enable seamless communication between prospective buyers and sellers.',
    },
    {
      slug: 'terms',
      title: 'Terms and Conditions',
      content: 'By using Ulist, you agree to post only truthful, verified classified ads. Prohibited goods or spam will result in immediate suspension.',
    },
    {
      slug: 'about',
      title: 'About Ulist',
      content: 'Ulist is India’s fast and intuitive classifieds marketplace connecting millions of local buyers and sellers across goods, properties, vehicles, and services.',
    },
  ]);

  // Seed Settings
  await Setting.insertMany([
    { key: 'auto_approve', value: true, description: 'Automatically approve newly submitted ads' },
    { key: 'ad_validity_days', value: 30, description: 'Validity duration in days before an ad expires' },
    { key: 'max_active_ads_per_user', value: 15, description: 'Maximum active listings per registered user' },
    { key: 'max_photos_per_ad', value: 8, description: 'Maximum photos per listing' },
    {
      key: 'prohibited_words',
      value: ['counterfeit', 'fake currency', 'weapon', 'narcotics', 'stolen'],
      description: 'Disallowed words that trigger immediate listing block',
    },
    { key: 'support_phone', value: '+911800123456', description: 'Customer care helpline' },
    { key: 'support_email', value: 'support@ulist.in', description: 'Support email address' },
    { key: 'whatsapp_number', value: '+919876543210', description: 'Official WhatsApp support number' },
  ]);

  // Seed exactly 4 sample ads per category (48 total) so new visitors see a lively marketplace
  const existingAdsCount = await Ad.countDocuments({ status: { $ne: 'deleted' } });
  if (existingAdsCount >= 48) {
    console.log(`[Seed] DB already has ${existingAdsCount} ads. Skipping sample ads seeding.`);
    return;
  }

  const SECOND_SAMPLE_ADS: any[] = [
    {
      cat: 'cars',
      title: 'Hyundai Creta SX (O) 1.5 Diesel Automatic 2022 Sunroof',
      desc: 'Top model with panoramic sunroof, ventilated seats, Bose audio, comprehensive insurance till 2028.',
      price: 1480000,
      city: 'Delhi',
      locality: 'Rohini Sector 13',
      attrs: { brand: 'Hyundai', year: 2022, fuel: 'Diesel', transmission: 'Automatic', km_driven: 18500, owners: '1' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'properties',
      title: '3 BHK Independent Villa with Private Garden and Modular Kitchen',
      desc: 'Newly constructed duplex villa in gated community, 2100 sqft super built-up, Italian marble flooring.',
      price: 13500000,
      city: 'Hyderabad',
      locality: 'Gachibowli',
      attrs: { property_type: 'Independent House', bedrooms: '3', area_sqft: 2100, furnishing: 'Furnished', listed_by: 'Owner' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'mobiles',
      title: 'Samsung Galaxy S23 Ultra 5G (256GB / 12GB RAM) Phantom Black',
      desc: 'In brand new condition with original S-Pen, 200MP camera, 100x zoom, bill and box with fast charger.',
      price: 74000,
      city: 'Mumbai',
      locality: 'Lajpat Nagar',
      attrs: { brand: 'Samsung', model: 'Galaxy S23 Ultra', storage: '256GB', condition: 'Like New' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'jobs',
      title: 'Digital Marketing & Social Media Manager for Ecommerce Brand',
      desc: 'Manage Meta & Google ads, social media handles, and influencer campaigns. 2+ years experience preferred.',
      price: 0,
      salary: { from: 35000, to: 50000, period: 'Monthly' },
      city: 'Bengaluru',
      locality: 'Koramangala',
      attrs: { salary_from: 35000, salary_to: 50000, salary_period: 'Monthly', position_type: 'Full-time', experience: '2-5 years' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'bikes',
      title: 'Yamaha YZF R15 V4 Racing Blue 2023, Quickshifter ABS',
      desc: 'Showroom condition R15 V4, only 7800 km driven, first owner, scratchless, ceramic coated with dual ABS.',
      price: 165000,
      city: 'Mumbai',
      locality: 'Bandra West',
      attrs: { brand: 'Yamaha', model: 'YZF R15 V4', year: 2023, km_driven: 7800, owners: '1' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'electronics',
      title: 'LG 260L 3 Star Frost Free Double Door Refrigerator Smart Inverter',
      desc: 'Shiny steel finish double door fridge in 100% working order, 10 year compressor warranty with stabilizer free operation.',
      price: 17500,
      city: 'Delhi',
      locality: 'Janakpuri',
      attrs: { brand: 'LG', condition: 'Used - Good', years_used: 2 },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'commercial-vehicles',
      title: 'Mahindra Bolero Maxi Truck Plus 2022 Power Steering',
      desc: 'Heavy duty commercial pickup truck, original tyres, all papers clear, ready for transport business.',
      price: 520000,
      city: 'Pune',
      locality: 'Chakan MIDC',
      attrs: { vehicle_type: 'Pickup Truck', brand: 'Mahindra', year: 2022 },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'furniture',
      title: 'L-Shape 6 Seater Fabric Sectional Sofa Set with Pillows',
      desc: 'Grey premium suede fabric sofa, high density foam, only 1 year old, zero stains, extremely comfortable.',
      price: 19500,
      city: 'Mumbai',
      locality: 'Powai',
      attrs: { material: 'Fabric / Foam', condition: 'Used - Like New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'fashion',
      title: 'Bridal Heritage Heavy Velvet Lehenga Choli with Embroidered Dupatta',
      desc: 'Exquisite maroon zardozi handwork lehenga worn once for reception, professionally dry cleaned in box.',
      price: 14500,
      city: 'Delhi',
      locality: 'Chandni Chowk',
      attrs: { type: 'Bridal Lehenga', size: 'Free Size', condition: 'Used - Like New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'books-sports',
      title: 'Yamaha F310 Acoustic Guitar with Padded Gig Bag & Plectrums',
      desc: 'Original Yamaha spruce top dreadnought guitar, clear tone, low action strings, perfect for beginners and pros.',
      price: 7200,
      city: 'Pune',
      locality: 'FC Road',
      attrs: { condition: 'Used - Like New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'pets',
      title: 'Persian Kitten Triple Coat Doll Face (2 Months Old)',
      desc: 'Pure white fluffy triple coat Persian kitten, litter trained, dewormed, extremely playful and friendly with kids.',
      price: 12000,
      city: 'Mumbai',
      locality: 'Andheri Lokhandwala',
      attrs: { breed: 'Persian Cat', age: '60 Days' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'services',
      title: 'Expert Laptop & Smartphone Repair at Doorstep (Screen, Battery, OS)',
      desc: 'Quick 60-minute doorstep repair for MacBooks, Dell, HP, iPhone, and Android with 90-day warranty on spare parts.',
      price: 499,
      city: 'Bengaluru',
      locality: 'HSR Layout',
      attrs: { service_type: 'Electronics Repair', price_type: 'Starting at' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Batch 3 & 4 (2 more authentic ads for each of the 12 categories -> 4 ads each)
  const ADDITIONAL_SAMPLE_ADS: any[] = [
    // 1. CARS (+2)
    {
      cat: 'cars',
      title: 'Honda City ZX CVT Automatic 2021 Sunroof, Leather Seats',
      desc: 'Top-end ZX variant, radiant red metallic, full company service record, zero dep insurance valid till Nov 2027.',
      price: 1120000,
      city: 'Mumbai',
      locality: 'Bandra Kurla Complex',
      attrs: { brand: 'Honda', year: 2021, fuel: 'Petrol', transmission: 'Automatic', km_driven: 29000, owners: '1' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'cars',
      title: 'Tata Nexon Fearless Plus S Petrol Manual 2023 360 Camera',
      desc: 'Daytona grey, dual-tone roof, 10.25 inch touchscreen, ventilated seats, air purifier, single owner driven.',
      price: 1180000,
      city: 'Pune',
      locality: 'Kothrud',
      attrs: { brand: 'Tata', year: 2023, fuel: 'Petrol', transmission: 'Manual', km_driven: 14200, owners: '1' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    },

    // 2. PROPERTIES (+2)
    {
      cat: 'properties',
      title: '1 BHK Semi-Furnished Flat with Balcony near Metro Station',
      desc: 'Prime location, piped gas, lift with power backup, 24/7 security and BMC water supply. Low maintenance society.',
      price: 5200000,
      city: 'Mumbai',
      locality: 'Borivali West',
      attrs: { property_type: 'Apartment', bedrooms: '1', area_sqft: 580, furnishing: 'Semi-furnished', listed_by: 'Owner' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'properties',
      title: 'Commercial Office Space / Showroom 1200 sqft on Main Road',
      desc: 'Corner property with huge glass frontage, reserved basement parking, high footfall, ideal for clinic, bank, or showroom.',
      price: 18500000,
      city: 'Delhi',
      locality: 'Connaught Place Outer Circle',
      attrs: { property_type: 'Showroom / Office', area_sqft: 1200, furnishing: 'Unfurnished', listed_by: 'Dealer' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },

    // 3. MOBILES (+2)
    {
      cat: 'mobiles',
      title: 'OnePlus 12 5G (512GB / 16GB RAM) Emerald Green with 100W SuperVOOC',
      desc: 'Snapdragon 8 Gen 3 flagship, Hasselblad cameras, 2K 120Hz display, scratchless condition with box and bill.',
      price: 520000,
      city: 'Bengaluru',
      locality: 'Koramangala 5th Block',
      attrs: { brand: 'OnePlus', model: 'OnePlus 12', storage: '512GB', condition: 'Like New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'mobiles',
      title: 'Apple iPad Air 5th Gen M1 (64GB WiFi) Space Grey with Folio Case',
      desc: 'Superfast Apple M1 chip, 10.9 inch Liquid Retina, stereo speakers, rarely used for Netflix, flawless battery health.',
      price: 38000,
      city: 'Pune',
      locality: 'Aundh',
      attrs: { brand: 'Apple', model: 'iPad Air 5th Gen', storage: '64GB', condition: 'Like New' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    },

    // 4. JOBS (+2)
    {
      cat: 'jobs',
      title: 'Accountant / Tally Prime Executive for Trading Firm',
      desc: 'Looking for B.Com graduate with 2+ years experience in GST return filing, TDS, bank reconciliation, and Tally Prime.',
      price: 0,
      salary: { from: 22000, to: 30000, period: 'Monthly' },
      city: 'Ahmedabad',
      locality: 'SG Highway',
      attrs: { salary_from: 22000, salary_to: 30000, salary_period: 'Monthly', position_type: 'Full-time', experience: '1-3 years' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'jobs',
      title: 'Full Stack React & Node.js Developer (Remote / Hybrid)',
      desc: 'Immediate hiring for product startup. Requirements: TypeScript, React Native or Next.js, MongoDB, REST APIs. Competitive package.',
      price: 0,
      salary: { from: 50000, to: 80000, period: 'Monthly' },
      city: 'Hyderabad',
      locality: 'HITEC City',
      attrs: { salary_from: 50000, salary_to: 80000, salary_period: 'Monthly', position_type: 'Full-time', experience: '2-5 years' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    },

    // 5. BIKES (+2)
    {
      cat: 'bikes',
      title: 'Hero Xpulse 200 4V Pro Edition 2023 with Rally Kit',
      desc: 'Trail ready offroad motorcycle, adjustable suspension, Maxxis knobby tyres, handlebar risers, zero accidental record.',
      price: 138000,
      city: 'Delhi',
      locality: 'Saket',
      attrs: { brand: 'Hero', model: 'Xpulse 200 4V', year: 2023, km_driven: 9400, owners: '1' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'bikes',
      title: 'TVS Jupiter 125 Disc SmartXonnect 2022 All-in-One Scooter',
      desc: 'Front disc brake, Bluetooth navigation, LED headlamp, 33L underseat storage fits 2 helmets, very smooth family scooter.',
      price: 68000,
      city: 'Mumbai',
      locality: 'Goregaon East',
      attrs: { brand: 'TVS', model: 'Jupiter 125', year: 2022, km_driven: 11200, owners: '1' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    },

    // 6. ELECTRONICS & APPLIANCES (+2)
    {
      cat: 'electronics',
      title: 'IFB 8 Kg 5 Star Fully Automatic Front Load Washing Machine',
      desc: 'Steam wash technology, 1400 RPM spin, Aqua Energie, in warranty with original invoice and drain pipes.',
      price: 24500,
      city: 'Bengaluru',
      locality: 'Whitefield',
      attrs: { brand: 'IFB', condition: 'Used - Like New', years_used: 1 },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'electronics',
      title: 'Daikin 1.5 Ton 5 Star Inverter Split AC with PM 2.5 Filter',
      desc: 'Copper condenser coil, energy efficient, fast cooling even in 50°C, outdoor unit and remote included in working condition.',
      price: 26000,
      city: 'Chandigarh',
      locality: 'Sector 35',
      attrs: { brand: 'Daikin', condition: 'Used - Good', years_used: 2 },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80',
    },

    // 7. COMMERCIAL VEHICLES & SPARES (+2)
    {
      cat: 'commercial-vehicles',
      title: 'Ashok Leyland Dost Plus 2021 Pickup Commercial Goods Vehicle',
      desc: 'Power steering, factory body, high payload capacity, national goods permit, insurance valid up to 2027.',
      price: 480000,
      city: 'Kolkata',
      locality: 'Dankuni Transport Nagar',
      attrs: { vehicle_type: 'Pickup Truck', brand: 'Ashok Leyland', year: 2021 },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'commercial-vehicles',
      title: 'Bajaj Maxima Z CNG Auto Rickshaw 2022 Passenger',
      desc: 'Single owner driven, green CNG pass, high mileage, clean passenger seats, fitness valid till late 2027.',
      price: 195000,
      city: 'Delhi',
      locality: 'Anand Vihar',
      attrs: { vehicle_type: 'Three Wheeler / Auto', brand: 'Bajaj', year: 2022 },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    },

    // 8. FURNITURE (+2)
    {
      cat: 'furniture',
      title: 'King Size Teak Wood Hydraulic Storage Bed with Mattress',
      desc: 'Heavy pure teakwood bed with hydraulic box storage, Wakefit 8 inch memory foam orthopedic mattress included.',
      price: 32000,
      city: 'Mumbai',
      locality: 'Juhu',
      attrs: { material: 'Teak Wood', condition: 'Used - Like New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'furniture',
      title: 'Ergonomic High Back Mesh Office Chair with Adjustable Lumbar',
      desc: 'Green Soul ergonomic swivel chair, 3D armrests, heavy duty metal base, pneumatic gas lift, under warranty.',
      price: 6500,
      city: 'Pune',
      locality: 'Hinjewadi Phase 1',
      attrs: { material: 'Breathable Mesh', condition: 'Like New' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    },

    // 9. FASHION (+2)
    {
      cat: 'fashion',
      title: 'Original Woodland Leather Rugged Trekking Boots (UK Size 8)',
      desc: 'Genuine full grain nubuck leather boots, vibram rubber outsole for grip, worn twice for trek, like new condition.',
      price: 2400,
      city: 'Dehradun',
      locality: 'Rajpur Road',
      attrs: { type: 'Footwear / Boots', size: 'UK 8', condition: 'Used - Like New' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'fashion',
      title: 'Pure Banarasi Katan Silk Saree with Zari Pallu and Blouse Piece',
      desc: 'Royal blue traditional Banarasi silk saree with authentic silk mark tag, ideal for weddings and grand festive wear.',
      price: 5800,
      city: 'Varanasi',
      locality: 'Godowlia',
      attrs: { type: 'Silk Saree', size: 'Free Size', condition: 'Brand New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    },

    // 10. BOOKS, SPORTS & HOBBIES (+2)
    {
      cat: 'books-sports',
      title: 'Kobo Clara 2E Waterproof E-Reader with 16GB Storage & Warm Light',
      desc: '6 inch glare-free HD screen, 16GB holds 12,000 books, weeks of battery life, with original origami sleep cover.',
      price: 8900,
      city: 'Bengaluru',
      locality: 'Indiranagar',
      attrs: { condition: 'Like New' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'books-sports',
      title: 'Yonex Astrox 88D Pro Badminton Racket (4U G5) with BG65 String',
      desc: 'Genuine Japan made Yonex racket strung at 26 lbs, full carbon graphite frame, comes with Yonex thermo bag.',
      price: 8500,
      city: 'Hyderabad',
      locality: 'Kukatpally',
      attrs: { condition: 'Used - Like New' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    },

    // 11. PETS (+2)
    {
      cat: 'pets',
      title: 'Shih Tzu Puppy Tricolor Heavy Coat (60 Days Old)',
      desc: 'Purebred champion bloodline Shih Tzu puppy, vaccinated, dewormed, vet verified booklet, very gentle and kid-friendly.',
      price: 19000,
      city: 'Jaipur',
      locality: 'Vaishali Nagar',
      attrs: { breed: 'Shih Tzu', age: '60 Days' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'pets',
      title: 'Imported Curved Glass Aquarium 2.5 Feet with Filter & LED Light',
      desc: 'Complete aquarium setup with SOBO power filter, underwater LED bar, decorative driftwood, and white river gravel.',
      price: 4800,
      city: 'Mumbai',
      locality: 'Malad West',
      attrs: { type: 'Aquarium & Fish', condition: 'Used - Good' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80',
    },

    // 12. SERVICES (+2)
    {
      cat: 'services',
      title: 'Interior Painting & Waterproofing Services with Asian Paints Royale',
      desc: 'Experienced painters, mechanized sanding, wall putty repairs, free site inspection and computerized color consultation.',
      price: 1499,
      city: 'Mumbai',
      locality: 'Andheri West',
      attrs: { service_type: 'Home Painting', price_type: 'Starting at' },
      isFeatured: false,
      img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
    },
    {
      cat: 'services',
      title: 'Packers and Movers Relocation Service (Household & Bike Transport)',
      desc: 'Safe packing with bubble wrap, corrugated sheets, dedicated covered container trucks, transit insurance available.',
      price: 2999,
      city: 'Delhi',
      locality: 'South Extension',
      attrs: { service_type: 'Packers & Movers', price_type: 'Starting at' },
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // 12 primary templates + 12 secondary templates + 24 additional templates = exactly 4 per category (48 ads)
  const combinedSpecs = [...DEMO_ADS_SPEC, ...SECOND_SAMPLE_ADS, ...ADDITIONAL_SAMPLE_ADS];
  const adsToInsert: any[] = [];
  const validityDays = 30;

  for (let i = 0; i < combinedSpecs.length; i++) {
    const template = combinedSpecs[i];
    const user = demoUsers[i % demoUsers.length];
    const categoryDoc = categoryMap.get(template.cat) || categoryMap.get('cars');

    adsToInsert.push({
      user: user._id,
      category: categoryDoc._id,
      subcategory: categoryDoc.subcategories?.[0]?._id || null,
      title: template.title,
      description: template.desc,
      price: template.price,
      salary: template.salary,
      attributes: template.attrs || {},
      images: [
        { url: template.img || PLACEHOLDER_IMG, publicId: `sample_${template.cat}_${i}` },
      ],
      city: template.city || 'Mumbai',
      locality: template.locality || 'City Center',
      geo: { lat: 19.076, lng: 72.8777 },
      contactName: user.name,
      phone: user.phone,
      showPhone: true,
      status: 'active',
      isFeatured: !!template.isFeatured,
      featuredUntil: template.isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      views: Math.floor(Math.random() * 35) + 12,
      expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)),
    });
  }

  await Ad.insertMany(adsToInsert);
  console.log(`[Seed] Seeded exactly ${adsToInsert.length} sample ads (2 ads for each of the 12 categories)!`);

  console.log('[Seed] Seeding completed successfully!');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
