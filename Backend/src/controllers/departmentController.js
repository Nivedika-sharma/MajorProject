import Department from '../models/Department.js';

export const listDepartments = async (req, res) => {
  try {
    const deps = await Department.find().sort({ name: 1 });
    res.json(deps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    const d = new Department({ name, description, icon, color });
    await d.save();
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
