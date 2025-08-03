// Performance Dashboard for development environment
import React, { useState, useEffect, useCallback } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const PerformanceDashboard = ({ 
  enabled = process.env.NODE_ENV === 'development',
  onClose 
}) => {
  const [metrics, setMetrics] = useState({
    webVitals: {
      lcp: { value: 0, rating: 'good', history: [] },
      fid: { value: 0, rating: 'good', history: [] },
      cls: { value: 0, rating: 'good', history: [] },
      fcp: { value: 0, rating: 'good', history: [] },
      ttfb: { value: 0, rating: 'good', history: [] },
    },
    resources: {
      memoryUsage: 0,
      memoryLimit: 0,
      domNodes: 0,
      eventListeners: 0,
      networkRequests: 0,
      cacheSize: 0,
    },
    performance: {
      loadTime: 0,
      renderTime: 0,
      bundleSize: 0,
      fps: 0,
    },
    network: {
      requests: [],
      totalSize: 0,
      cacheHitRate: 0,
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [isRecording, setIsRecording] = useState(true);

  // Rating thresholds for Web Vitals
  const thresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 800, needsImprovement: 1800 },
  };

  // Get rating based on value and thresholds
  const getRating = (value, metric) => {
    const threshold = thresholds[metric];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  // Update Web Vitals metrics
  const updateWebVital = useCallback((metric, value) => {
    const rating = getRating(value, metric);
    
    setMetrics(prev => ({
      ...prev,
      webVitals: {
        ...prev.webVitals,
        [metric]: {
          value: Math.round(value * (metric === 'cls' ? 1000 : 1)) / (metric === 'cls' ? 1000 : 1),
          rating,
          history: [...prev.webVitals[metric].history, { 
            value, 
            timestamp: Date.now(),
            rating 
          }].slice(-20) // Keep last 20 measurements
        }
      }
    }));
  }, []);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (!enabled || !isRecording) return;

    getCLS((metric) => updateWebVital('cls', metric.value));
    getFID((metric) => updateWebVital('fid', metric.value));
    getFCP((metric) => updateWebVital('fcp', metric.value));
    getLCP((metric) => updateWebVital('lcp', metric.value));
    getTTFB((metric) => updateWebVital('ttfb', metric.value));
  }, [enabled, isRecording, updateWebVital]);

  // Monitor resource metrics
  useEffect(() => {
    if (!enabled || !isRecording) return;

    const updateResourceMetrics = () => {
      // Memory metrics
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          resources: {
            ...prev.resources,
            memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            memoryLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        }));
      }

      // DOM metrics
      const domNodes = document.querySelectorAll('*').length;
      const eventListeners = getEventListenerCount();
      
      setMetrics(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          domNodes,
          eventListeners,
        }
      }));

      // Network metrics
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((sum, resource) => {
        return sum + (resource.transferSize || 0);
      }, 0);

      setMetrics(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          networkRequests: resources.length,
        },
        network: {
          ...prev.network,
          requests: resources.slice(-10), // Keep last 10 requests
          totalSize: Math.round(totalSize / 1024), // KB
        }
      }));
    };

    // Initial measurement
    updateResourceMetrics();

    // Periodic updates
    const interval = setInterval(updateResourceMetrics, 3000);

    return () => clearInterval(interval);
  }, [enabled, isRecording]);

  // Estimate event listener count (approximation)
  const getEventListenerCount = () => {
    // This is an approximation since there's no direct API
    const elements = document.querySelectorAll('*');
    let count = 0;
    
    // Common event types to check
    const eventTypes = ['click', 'mouseover', 'mouseout', 'focus', 'blur', 'keydown', 'keyup'];
    
    elements.forEach(element => {
      eventTypes.forEach(type => {
        if (element[`on${type}`] || element.getAttribute(`on${type}`)) {
          count++;
        }
      });
    });
    
    return count;
  };

  // Performance score calculation
  const calculatePerformanceScore = () => {
    const { webVitals } = metrics;
    let score = 100;
    
    // Deduct points based on Web Vitals ratings
    Object.entries(webVitals).forEach(([metric, data]) => {
      if (data.rating === 'needs-improvement') score -= 10;
      if (data.rating === 'poor') score -= 20;
    });
    
    // Memory usage penalty
    if (metrics.resources.memoryUsage > 100) score -= 15;
    if (metrics.resources.memoryUsage > 200) score -= 25;
    
    return Math.max(0, score);
  };

  if (!enabled) return null;

  const performanceScore = calculatePerformanceScore();

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90vw',
      maxWidth: '800px',
      height: '80vh',
      background: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      borderRadius: '12px',
      padding: '20px',
      zIndex: 10000,
      fontFamily: 'monospace',
      fontSize: '12px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>🚀 Performance Dashboard</h2>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
            Score: <span style={{ 
              color: performanceScore >= 90 ? '#10b981' : 
                     performanceScore >= 70 ? '#f59e0b' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {performanceScore}/100
            </span>
            {isRecording && <span style={{ color: '#ef4444', marginLeft: '10px' }}>● Recording</span>}
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsRecording(!isRecording)}
            style={{
              background: isRecording ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              marginRight: '10px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {isRecording ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {['overview', 'web-vitals', 'resources', 'network'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '12px',
              textTransform: 'capitalize',
              borderBottom: activeTab === tab ? '2px solid #10b981' : '2px solid transparent',
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Web Vitals Summary */}
            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>Web Vitals</h3>
              {Object.entries(metrics.webVitals).map(([metric, data]) => (
                <div key={metric} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                }}>
                  <span style={{ textTransform: 'uppercase' }}>{metric}:</span>
                  <span style={{ 
                    color: data.rating === 'good' ? '#10b981' : 
                           data.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444'
                  }}>
                    {data.value}{metric === 'cls' ? '' : 'ms'}
                  </span>
                </div>
              ))}
            </div>

            {/* Resource Summary */}
            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>Resources</h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}>
                <span>Memory:</span>
                <span style={{ 
                  color: metrics.resources.memoryUsage > 100 ? '#ef4444' : '#10b981'
                }}>
                  {metrics.resources.memoryUsage}MB / {metrics.resources.memoryLimit}MB
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}>
                <span>DOM Nodes:</span>
                <span>{metrics.resources.domNodes}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}>
                <span>Network Requests:</span>
                <span>{metrics.resources.networkRequests}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'web-vitals' && (
          <div>
            <h3 style={{ margin: '0 0 15px 0' }}>Web Vitals Details</h3>
            {Object.entries(metrics.webVitals).map(([metric, data]) => (
              <div key={metric} style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    textTransform: 'uppercase', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {metric}
                  </span>
                  <span style={{ 
                    color: data.rating === 'good' ? '#10b981' : 
                           data.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {data.value}{metric === 'cls' ? '' : 'ms'}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  <div>Rating: <span style={{ 
                    color: data.rating === 'good' ? '#10b981' : 
                           data.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444'
                  }}>
                    {data.rating}
                  </span></div>
                  <div>Measurements: {data.history.length}</div>
                  {data.history.length > 1 && (
                    <div>
                      Trend: {data.history[data.history.length - 1].value > data.history[0].value ? '📈' : '📉'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h3 style={{ margin: '0 0 15px 0' }}>Resource Usage</h3>
            
            {/* Memory Usage */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Memory Usage</h4>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '15px',
                borderRadius: '6px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  Used: {metrics.resources.memoryUsage}MB / {metrics.resources.memoryLimit}MB
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(metrics.resources.memoryUsage / metrics.resources.memoryLimit) * 100}%`,
                    height: '100%',
                    background: metrics.resources.memoryUsage > metrics.resources.memoryLimit * 0.8 ? '#ef4444' : '#10b981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* DOM Complexity */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>DOM Complexity</h4>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '15px',
                borderRadius: '6px'
              }}>
                <div>DOM Nodes: {metrics.resources.domNodes}</div>
                <div>Event Listeners: {metrics.resources.eventListeners}</div>
                <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
                  {metrics.resources.domNodes > 1500 ? '⚠️ High DOM complexity may impact performance' : '✅ DOM complexity is acceptable'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            <h3 style={{ margin: '0 0 15px 0' }}>Network Activity</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '15px'
              }}>
                <div>Total Requests: {metrics.resources.networkRequests}</div>
                <div>Total Size: {metrics.network.totalSize}KB</div>
              </div>

              <h4 style={{ margin: '0 0 10px 0' }}>Recent Requests</h4>
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {metrics.network.requests.slice(-10).map((request, index) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    marginBottom: '4px',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {request.name.split('/').pop() || request.name}
                    </div>
                    <div style={{ opacity: 0.7 }}>
                      {Math.round(request.duration)}ms • {Math.round((request.transferSize || 0) / 1024)}KB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;