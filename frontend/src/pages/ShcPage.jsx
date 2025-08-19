import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ShcPage.css';

const ShcPage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.aadharNumber) {
      navigate('/login');
      return;
    }

    const fetchShc = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`http://localhost:5000/api/shc/${user.aadharNumber}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch SHC data');
        setRecords(data.records || []);
      } catch (err) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchShc();
  }, [isLoggedIn, user, navigate]);

  const normalizeValue = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'object') {
      const entries = Object.entries(val);
      if (entries.length === 1) return normalizeValue(entries[0][1]);
      return JSON.stringify(val);
    }
    return val;
  };

  const getVal = (obj, keys) => {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj || {}, k)) {
        return normalizeValue(obj[k]);
      }
    }
    return '-';
  };

  return (
    <div className="shc-page">
      <div className="shc-container">
      <div className="shc-header">
        <div className="shc-title">
          <span className="advice-icon">🧪</span>
          <div>
            <h2>Soil Health Card (SHC)</h2>
            <div className="shc-meta">Aadhar: {user?.aadharNumber}</div>
          </div>
        </div>
        <div className="shc-toolbar">
          <button className="toggle-raw" onClick={() => setShowRaw((s) => !s)}>
            {showRaw ? 'Hide raw JSON' : 'Show raw JSON'}
          </button>
          <Link to="/chatbot" className="submit-btn shc-link">Go to Chatbot</Link>
        </div>
      </div>

      {loading && <p className="loading">Loading SHC data...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        records.length === 0 ? (
          <p className="empty">No SHC records found for your Aadhar.</p>
        ) : (
          <div className="shc-cards">
            {records.map((rec, idx) => (
              <div className="shc-card" key={idx}>
                <div className="shc-card-header">
                  <div>
                    <div style={{ fontWeight: 600 }}>{getVal(rec, ['SURVEY_NO']) || 'Survey'}</div>
                    <div className="shc-meta">{getVal(rec, ['SOIL_TYPE'])}</div>
                  </div>
                  <span className="shc-badge">AADHAAR: {getVal(rec, ['AADHAAR_NO'])}</span>
                </div>

                <div className="shc-metrics">
                  <div className="metric">
                    <div className="label">pH</div>
                    <div className="value">{getVal(rec, ['PH', 'pH'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">EC</div>
                    <div className="value">{getVal(rec, ['EC'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">OC %</div>
                    <div className="value">{getVal(rec, ['OC_(%)','OC'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">N (kg/ha)</div>
                    <div className="value">{getVal(rec, ['N_(KG)','N'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">P (kg/ha)</div>
                    <div className="value">{getVal(rec, ['P_(KG)','P'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">K (kg/ha)</div>
                    <div className="value">{getVal(rec, ['K_(KG)','K'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">S (ppm)</div>
                    <div className="value">{getVal(rec, ['S_(PPM)','S'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">Zn (ppm)</div>
                    <div className="value">{getVal(rec, ['ZN_(PPM)','ZN'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">Fe (ppm)</div>
                    <div className="value">{getVal(rec, ['FE_(PPM)','FE'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">Mn (ppm)</div>
                    <div className="value">{getVal(rec, ['MN_(PPM)','MN'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">Cu (ppm)</div>
                    <div className="value">{getVal(rec, ['CU_(PPM)','CU'])}</div>
                  </div>
                  <div className="metric">
                    <div className="label">B (ppm)</div>
                    <div className="value">{getVal(rec, ['B_(PPM)','B'])}</div>
                  </div>
                </div>

                {getVal(rec, ['RECOMMENDATION']) !== '-' && (
                  <div className="shc-reco">
                    <strong>Recommendation:</strong>
                    <div>{getVal(rec, ['RECOMMENDATION'])}</div>
                  </div>
                )}

                {showRaw && (
                  <div className="raw-block">
                    <pre>{JSON.stringify(rec, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
      </div>
    </div>
  );
};

export default ShcPage;


