const { getDb } = require('../db/init');

const CatalogService = {
  getParts: (filters = {}) => {
    const db = getDb();
    let query = 'SELECT * FROM Parts WHERE 1=1';
    const params = [];

    if (filters.keyword) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }
    if (filters.category) {
      // แมป Category จากหน้าบ้าน (lowercase/singular) ไปยังข้อมูลในฐานข้อมูล SQLite (Capitalized/Plural)
      const catLower = filters.category.toLowerCase().trim();
      if (catLower === 'turbo') {
        query += ' AND category = ?';
        params.push('Turbo');
      } else if (catLower === 'exhaust') {
        query += ' AND category = ?';
        params.push('Exhaust');
      } else if (catLower === 'suspension') {
        query += ' AND category = ?';
        params.push('Suspension');
      } else if (catLower === 'brake' || catLower === 'brakes') {
        query += ' AND category = ?';
        params.push('Brakes');
      } else if (catLower === 'intercooler') {
        query += ' AND category = ?';
        params.push('intercooler');
      } else if (catLower === 'engine') {
        // ในฐานข้อมูล เครื่องยนต์ถูกบันทึกแยกเป็น ECU และ Fuel System
        query += ' AND category IN (?, ?)';
        params.push('ECU', 'Fuel System');
      } else {
        query += ' AND LOWER(category) = ?';
        params.push(catLower);
      }
    }
    if (filters.minPrice != null && !isNaN(filters.minPrice)) {
      query += ' AND price >= ?';
      params.push(Number(filters.minPrice));
    }
    if (filters.maxPrice != null && !isNaN(filters.maxPrice)) {
      query += ' AND price <= ?';
      params.push(Number(filters.maxPrice));
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  getSlots: () => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM DynoSlots');
    return stmt.all();
  }
};

module.exports = CatalogService;
