import { AttendanceRecord } from '../components/AttendanceList';

export const exportToCSV = (records: AttendanceRecord[], filename: string): void => {
  // Create CSV header
  const headers = ['Date', 'Class', 'Status'];
  const csvRows = [headers.join(',')];
  
  // Add data rows
  records.forEach(record => {
    const row = [
      record.date,
      record.className,
      record.status
    ];
    csvRows.push(row.join(','));
  });
  
  // Create CSV string
  const csvString = csvRows.join('\n');
  
  // Create download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getCurrentMonthData = (records: AttendanceRecord[]): AttendanceRecord[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
};