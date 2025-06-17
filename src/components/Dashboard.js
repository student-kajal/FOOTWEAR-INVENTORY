// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { FaBoxOpen, FaTrashAlt, FaCubes } from 'react-icons/fa';
// import api from '../utils/api';

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     totalProducts: 0,
//     totalStock: 0,
//     deletedProducts: 0
//   });

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const res = await api.get('/products');
//         const products = res.data.data || [];
//         setStats({
//           totalProducts: products.length,
//           totalStock: products.reduce((sum, p) => sum + (p.cartons * p.pairPerCarton), 0),
//           deletedProducts: products.filter(p => p.isDeleted).length
//         });
//       } catch {
//         setStats({ totalProducts: 0, totalStock: 0, deletedProducts: 0 });
//       }
//     };
//     fetchStats();
//   }, []);

//   return (
//     <div className="container py-4">
//       <h2 className="text-center mb-5 fw-bold">
//         Welcome to <span className="text-primary">GPFAX Inventory Dashboard</span>
//       </h2>
//       <div className="row g-4">
//         <div className="col-md-4">
//           <div className="card border-primary shadow-sm text-center h-100">
//             <div className="card-body">
//               <FaBoxOpen size={32} className="text-primary mb-2" />
//               <h5 className="card-title">Total Products</h5>
//               <p className="display-6 fw-bold text-primary">{stats.totalProducts}</p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-4">
//           <div className="card border-success shadow-sm text-center h-100">
//             <div className="card-body">
//               <FaCubes size={32} className="text-success mb-2" />
//               <h5 className="card-title">Total Pairs in Stock</h5>
//               <p className="display-6 fw-bold text-success">{stats.totalStock}</p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-4">
//           <div className="card border-danger shadow-sm text-center h-100">
//             <div className="card-body">
//               <FaTrashAlt size={32} className="text-danger mb-2" />
//               <h5 className="card-title">Deleted Products</h5>
//               <p className="display-6 fw-bold text-danger">{stats.deletedProducts}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//       <hr className="my-5" />
//       <div className="d-flex flex-wrap gap-3 justify-content-center">
//         <Link to="/products/add" className="btn btn-primary">+ Add Product</Link>
//         <Link to="/products" className="btn btn-outline-dark">View All Products</Link>
//         <Link to="/products/pdf-generator" className="btn btn-outline-info">Generate Product PDF</Link>
//         <Link to="/products/deleted" className="btn btn-outline-danger">View Deleted Products</Link>
//         <Link to="/products/history" className="btn btn-outline-secondary">Stock History</Link>
//         <Link to="/products/salary-report" className="btn btn-outline-secondary">Salary Report</Link>
//         <Link to="/challans" className="btn btn-outline-warning">Challan PDF</Link>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaCubes } from 'react-icons/fa';
import api from '../utils/api';
import Calculator from '../components/Calculator';  // <-- Import Calculator here

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    deletedProducts: 0
  });

  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/products');
        const products = res.data.data || [];
        setStats({
          totalProducts: products.length,
          totalStock: products.reduce((sum, p) => sum + (p.cartons * p.pairPerCarton), 0),
          deletedProducts: products.filter(p => p.isDeleted).length
        });
      } catch {
        setStats({ totalProducts: 0, totalStock: 0, deletedProducts: 0 });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container py-4 position-relative">

      <h2 className="text-center mb-5 fw-bold">
        Welcome to <span className="text-primary">GPFAX Inventory Dashboard</span>
      </h2>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-primary shadow-sm text-center h-100">
            <div className="card-body">
              <FaBoxOpen size={32} className="text-primary mb-2" />
              <h5 className="card-title">Total Products</h5>
              <p className="display-6 fw-bold text-primary">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-success shadow-sm text-center h-100">
            <div className="card-body">
              <FaCubes size={32} className="text-success mb-2" />
              <h5 className="card-title">Total Pairs in Stock</h5>
              <p className="display-6 fw-bold text-success">{stats.totalStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Toggle Button */}
      <div className="my-4 d-flex justify-content-center">
        <button
          onClick={() => setShowCalculator(prev => !prev)}
          className="btn btn-outline-primary"
        >
          {showCalculator ? 'Hide Calculator' : 'Show Calculator'}
        </button>
      </div>

      {/* Calculator Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: showCalculator ? '20px' : '-260px',
          transition: 'right 0.3s ease-in-out',
          zIndex: 1050
        }}
      >
        <Calculator />
      </div>

      <hr className="my-5" />
      <div className="d-flex flex-wrap gap-3 justify-content-center">
        <Link to="/products/add" className="btn btn-primary">+ Add Product</Link>
        <Link to="/products" className="btn btn-outline-dark">View All Products</Link>
      
        <Link to="/products/deleted" className="btn btn-outline-danger">View Deleted Products</Link>
        <Link to="/products/history" className="btn btn-outline-secondary">Stock History</Link>
        <Link to="/products/salary-report" className="btn btn-outline-secondary">Salary Report</Link>
        <Link to="/challans" className="btn btn-outline-warning">Challan PDF</Link>
      </div>
    </div>
  );
};

export default Dashboard;
