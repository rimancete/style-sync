import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data
  await prisma.booking.deleteMany({});
  await prisma.servicePricing.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.userCustomer.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.country.deleteMany({});

  // Create countries
  const countries = await Promise.all([
    prisma.country.create({
      data: {
        code: 'BR',
        name: 'Brazil',
        addressFormat: {
          fields: [
            'street',
            'unit',
            'district',
            'city',
            'stateProvince',
            'postalCode',
          ],
          required: ['street', 'city', 'stateProvince', 'postalCode'],
          validation: {
            postalCode: '^[0-9]{5}-?[0-9]{3}$',
            stateProvince: [
              'AC',
              'AL',
              'AP',
              'AM',
              'BA',
              'CE',
              'DF',
              'ES',
              'GO',
              'MA',
              'MT',
              'MS',
              'MG',
              'PA',
              'PB',
              'PR',
              'PE',
              'PI',
              'RJ',
              'RN',
              'RS',
              'RO',
              'RR',
              'SC',
              'SP',
              'SE',
              'TO',
            ],
          },
          labels: {
            street: 'Logradouro',
            unit: 'Número/Apartamento',
            district: 'Bairro',
            city: 'Cidade',
            stateProvince: 'Estado',
            postalCode: 'CEP',
          },
        },
      },
    }),
    prisma.country.create({
      data: {
        code: 'US',
        name: 'United States',
        addressFormat: {
          fields: ['street', 'unit', 'city', 'stateProvince', 'postalCode'],
          required: ['street', 'city', 'stateProvince', 'postalCode'],
          validation: {
            postalCode: '^\\d{5}(-\\d{4})?$',
            stateProvince: [
              'AL',
              'AK',
              'AZ',
              'AR',
              'CA',
              'CO',
              'CT',
              'DE',
              'FL',
              'GA',
              'HI',
              'ID',
              'IL',
              'IN',
              'IA',
              'KS',
              'KY',
              'LA',
              'ME',
              'MD',
              'MA',
              'MI',
              'MN',
              'MS',
              'MO',
              'MT',
              'NE',
              'NV',
              'NH',
              'NJ',
              'NM',
              'NY',
              'NC',
              'ND',
              'OH',
              'OK',
              'OR',
              'PA',
              'RI',
              'SC',
              'SD',
              'TN',
              'TX',
              'UT',
              'VT',
              'VA',
              'WA',
              'WV',
              'WI',
              'WY',
            ],
          },
          labels: {
            street: 'Street Address',
            unit: 'Apt/Suite',
            city: 'City',
            stateProvince: 'State',
            postalCode: 'ZIP Code',
          },
        },
      },
    }),
  ]);

  console.log('✅ Created countries');

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Acme Barbershop',
      urlSlug: 'acme',
      documentTitle: 'Acme Barbershop - Professional Haircuts',
      logoAlt: 'Acme Barbershop Logo',
      isActive: true,
    },
  });

  console.log('✅ Created customer');

  // Create branches
  const branch1 = await prisma.branch.create({
    data: {
      name: 'Unidade 1',
      countryCode: 'BR',
      street: 'Rua das Flores',
      unit: '123',
      district: 'Centro',
      city: 'São Paulo',
      stateProvince: 'SP',
      postalCode: '01234-567',
      formattedAddress:
        'Rua das Flores, 123, Centro, São Paulo, SP 01234-567, BR',
      phone: '(11) 98765-4321',
      countryId: countries[0].id, // Brazil
      customerId: customer1.id,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: 'Unidade 2',
      countryCode: 'BR',
      street: 'Av. Paulista',
      unit: '456',
      district: 'Bela Vista',
      city: 'São Paulo',
      stateProvince: 'SP',
      postalCode: '01310-100',
      formattedAddress:
        'Av. Paulista, 456, Bela Vista, São Paulo, SP 01310-100, BR',
      phone: '(11) 99876-5432',
      countryId: countries[0].id, // Brazil
      customerId: customer1.id,
    },
  });

  console.log('✅ Created branches');

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Social + Barba',
        description: 'Corte social masculino com acabamento de barba',
        duration: 45,
        customerId: customer1.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte Social',
        description: 'Corte social masculino',
        duration: 30,
        customerId: customer1.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Barba Completa',
        description: 'Aparar e modelar barba completa',
        duration: 20,
        customerId: customer1.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Degradê',
        description: 'Corte degradê masculino',
        duration: 40,
        customerId: customer1.id,
      },
    }),
  ]);

  console.log('✅ Created services');

  // Create service pricing for each branch
  const pricingData = [
    // Unidade 1 prices
    { serviceId: services[0].id, branchId: branch1.id, price: 35.0 },
    { serviceId: services[1].id, branchId: branch1.id, price: 25.0 },
    { serviceId: services[2].id, branchId: branch1.id, price: 15.0 },
    { serviceId: services[3].id, branchId: branch1.id, price: 30.0 },

    // Unidade 2 prices (slightly higher)
    { serviceId: services[0].id, branchId: branch2.id, price: 40.0 },
    { serviceId: services[1].id, branchId: branch2.id, price: 28.0 },
    { serviceId: services[2].id, branchId: branch2.id, price: 18.0 },
    { serviceId: services[3].id, branchId: branch2.id, price: 35.0 },
  ];

  await Promise.all(
    pricingData.map(pricing => prisma.servicePricing.create({ data: pricing })),
  );

  console.log('✅ Created service pricing');

  // Create professionals
  const professionals = await Promise.all([
    // Unidade 1 professionals
    prisma.professional.create({
      data: {
        name: 'Michel',
        branchId: branch1.id,
        customerId: customer1.id,
        photoUrl: 'https://via.placeholder.com/150/0000FF/808080?text=Michel',
        isActive: true,
      },
    }),
    prisma.professional.create({
      data: {
        name: 'Luiz',
        branchId: branch1.id,
        customerId: customer1.id,
        photoUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Luiz',
        isActive: true,
      },
    }),

    // Unidade 2 professionals
    prisma.professional.create({
      data: {
        name: 'Dario',
        branchId: branch2.id,
        customerId: customer1.id,
        photoUrl: 'https://via.placeholder.com/150/00FF00/000000?text=Dario',
        isActive: true,
      },
    }),
    prisma.professional.create({
      data: {
        name: 'Carlos',
        branchId: branch2.id,
        customerId: customer1.id,
        photoUrl: 'https://via.placeholder.com/150/FFFF00/000000?text=Carlos',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created professionals');

  // Create users
  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@stylesync.com',
        password: hashedPassword,
        name: 'Admin User',
        phone: '(11) 99999-9999',
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'client@test.com',
        password: hashedPassword,
        name: 'João Silva',
        phone: '(11) 98888-8888',
        role: UserRole.CLIENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff@stylesync.com',
        password: hashedPassword,
        name: 'Staff User',
        phone: '(11) 97777-7777',
        role: UserRole.STAFF,
      },
    }),
  ]);

  console.log('✅ Created users');

  // Create sample bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const sampleBookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: users[1].id, // client user
        branchId: branch1.id,
        serviceId: services[0].id, // Social + Barba
        professionalId: professionals[0].id, // Michel
        scheduledAt: tomorrow,
        totalPrice: 35.0,
        status: 'CONFIRMED',
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[1].id, // client user
        branchId: branch2.id,
        serviceId: services[1].id, // Corte Social
        professionalId: null, // Any professional
        scheduledAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // +2 hours
        totalPrice: 28.0,
        status: 'PENDING',
      },
    }),
  ]);

  console.log('✅ Created sample bookings');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`
📊 Seeded data summary:
- Customers: 1
- Branches: ${[branch1, branch2].length}
- Services: ${services.length}
- Service Pricing: ${pricingData.length}
- Professionals: ${professionals.length}
- Users: ${users.length}
- Sample Bookings: ${sampleBookings.length}

👥 Test accounts:
- Admin: admin@stylesync.com / 123456
- Client: client@test.com / 123456
- Staff: staff@stylesync.com / 123456
`);
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
