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
    title: 'Honda Activa 6G 2021, single owner, 18,000 km',
    desc: 'Very well maintained, single owner driven, genuine showroom service record. Insurance valid till Oct 2027.',
    price: 64000,
    city: 'Mumbai',
    locality: 'Andheri West',
    attrs: { brand: 'Honda', year: 2021, fuel: 'Petrol', transmission: 'Automatic', km_driven: 18000, owners: '1' },
    isFeatured: true,
  },
  {
    cat: 'cars',
    title: 'Maruti Suzuki Swift VXi 2019, mint condition, 42000 km',
    desc: 'Family used car, non-accidental, brand new Apollo tyres fitted last month. Price slightly negotiable on table.',
    price: 495000,
    city: 'Pune',
    locality: 'Kothrud',
    attrs: { brand: 'Maruti Suzuki', year: 2019, fuel: 'Petrol', transmission: 'Manual', km_driven: 42000, owners: '1' },
    isFeatured: true,
  },
  {
    cat: 'cars',
    title: 'Hyundai Creta SX Petrol 2022 Sunroof, 26,000 km only',
    desc: 'Top model with panoramic sunroof, ventilated seats, all original paint. Extended warranty active.',
    price: 1350000,
    city: 'Delhi',
    locality: 'Rohini Sector 14',
    attrs: { brand: 'Hyundai', year: 2022, fuel: 'Petrol', transmission: 'Manual', km_driven: 26000, owners: '1' },
    isFeatured: false,
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
  },
  {
    cat: 'properties',
    title: '3 BHK luxury apartment for rent with modular kitchen',
    desc: 'Fully furnished with air conditioners, sofa set, double beds and modular kitchen. Available immediately for families.',
    price: 45000,
    city: 'Mumbai',
    locality: 'Powai Hiranandani',
    attrs: { property_type: 'Apartment', bedrooms: '3', area_sqft: 1450, furnishing: 'Furnished', listed_by: 'Owner' },
    isFeatured: false,
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
  },
  {
    cat: 'mobiles',
    title: 'Samsung Galaxy S23 Ultra 256GB Green, 10 months used',
    desc: 'Flawless condition, stylus pen, S-Pen gestures, snapdragon 8 Gen 2. Original charger and box available.',
    price: 74000,
    city: 'Bengaluru',
    locality: 'Koramangala',
    attrs: { brand: 'Samsung', model: 'Galaxy S23 Ultra', storage: '256GB', condition: 'Like New' },
    isFeatured: false,
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
  },
  {
    cat: 'electronics',
    title: 'Sony Bravia 55 inch 4K Ultra HD Smart Google TV',
    desc: 'Purchased in late 2023, wall mounted since purchase, crystal clear display, Dolby Atmos sound. Selling due to relocation.',
    price: 42000,
    city: 'Mumbai',
    locality: 'Bandra West',
    attrs: { brand: 'Sony', condition: 'Used - Like New', years_used: 1 },
    isFeatured: false,
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
  },
  {
    cat: 'furniture',
    title: 'King size wooden bed with hydraulic storage and mattress',
    desc: 'Contemporary wooden bed with ample hydraulic under-bed storage. Includes 8 inch memory foam mattress.',
    price: 19500,
    city: 'Pune',
    locality: 'Hinjewadi Phase 1',
    attrs: { material: 'Engineered Wood', condition: 'Used - Good' },
    isFeatured: false,
  },
];

// Placeholder image (neutral 4:3 SVG converted into data URI or local placeholder)
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80';

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

  // Seed Ads (60 realistic demo ads)
  await Ad.deleteMany({});
  const adsToInsert: any[] = [];
  const validityDays = 30;

  for (let i = 0; i < 60; i++) {
    const template = DEMO_ADS_SPEC[i % DEMO_ADS_SPEC.length];
    const cityObj = CITIES_DATA[i % CITIES_DATA.length];
    const user = demoUsers[i % demoUsers.length];
    const categoryDoc = categoryMap.get(template.cat) || categoryMap.get('cars');

    const isFeatured = i % 5 === 0;
    const isSold = i === 13 || i === 27;

    adsToInsert.push({
      user: user._id,
      category: categoryDoc._id,
      subcategory: null,
      title: `${template.title} #${i + 1}`,
      description: template.desc,
      price: template.price,
      salary: template.salary,
      attributes: template.attrs,
      images: [
        { url: PLACEHOLDER_IMG, publicId: 'demo_1' },
      ],
      city: cityObj.name,
      locality: template.locality,
      geo: { lat: cityObj.lat, lng: cityObj.lng },
      contactName: user.name,
      phone: user.phone,
      showPhone: true,
      status: isSold ? 'sold' : 'active',
      isFeatured,
      featuredUntil: isFeatured ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      views: Math.floor(Math.random() * 85) + 5,
      expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - (i * 4 * 60 * 60 * 1000)),
    });
  }

  await Ad.insertMany(adsToInsert);
  console.log(`[Seed] Seeded ${adsToInsert.length} realistic classified ads across Indian cities`);

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
