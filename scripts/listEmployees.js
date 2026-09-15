import { getDataProvider } from './src/lib/repositories/dataProvider';
(async () => {
  try {
    const provider = getDataProvider();
    const employees = await provider.getEmployees();
    console.log(JSON.stringify(employees, null, 2));
  } catch (err) {
    console.error('Error fetching employees:', err);
  }
})();
