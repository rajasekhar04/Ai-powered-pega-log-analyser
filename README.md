# 🚀 Pega Log Analysis with Mistral AI

**Real-time AI-powered log analysis for Pega applications using Mistral 7B**

## 📋 Overview

This project provides a complete solution for analyzing Pega application logs using AI. It generates synthetic Pega logs with realistic anomalies and uses Mistral 7B (via Ollama) to perform intelligent analysis in real-time.

## 🎯 Features

### ✅ **Log Generator**
- Generates synthetic **Pega application logs** continuously
- Injects **random anomalies/errors**:
  - Database connection failures
  - SLA breaches
  - Rule cache overflow
  - Workflow halts
  - Security policy violations
  - Integration failures
- Includes realistic timestamps, thread IDs, user IDs, and case IDs
- Weighted probability: 70% INFO, 20% WARN, 10% ERROR

### ✅ **AI Log Analyzer**
- Uses **Mistral 7B** from Ollama for intelligent analysis
- Detects anomalies and classifies them
- Suggests severity levels (Low, Medium, High, Critical)
- Provides specific fix recommendations
- Fallback pattern-based analysis when AI fails

### ✅ **CLI Interface**
- **Rich console interface** with live updates
- **Simple mode** for basic output
- **JSON mode** for programmatic use
- **Test mode** for quick validation
- Color-coded output based on severity

### ✅ **Streamlit Dashboard**
- **Real-time log streaming** with live updates
- **AI analysis panel** showing structured results
- **Filtering capabilities** (Errors/Warnings/Info/All)
- **Interactive charts** and visualizations
- **Statistics summary** with metrics
- **Auto-refresh** functionality

## 🛠️ Technical Stack

- **Python 3.10+**
- **Ollama** (for Mistral 7B local inference)
- **Streamlit** (for web dashboard)
- **Rich** (for CLI interface)
- **Plotly** (for charts and visualizations)
- **Pandas** (for data manipulation)

## 📦 Installation

### 1. **Clone the Repository**
   ```bash
   git clone <repository-url>
cd pega-log-analysis
   ```

### 2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### 3. **Install Ollama**
   ```bash
# Download from: https://ollama.ai
# Or use package manager
   ```
   
### 4. **Pull Mistral Model**
   ```bash
ollama pull mistral
   ```

## 🚀 Usage

### **CLI Mode**

#### **Rich Dashboard Mode (Recommended)**
```bash
python main.py --mode rich
```

#### **Simple Console Mode**
```bash
python main.py --mode simple
```

#### **JSON Output Mode**
```bash
python main.py --mode json --max-logs 50
```

#### **Test Mode**
   ```bash
python main.py --mode test
```

### **Streamlit Dashboard**

#### **Start the Dashboard**
```bash
streamlit run dashboard.py
```

#### **Access the Dashboard**
- Open your browser to: `http://localhost:8501`
- Click "Start" to begin log generation and analysis
- Use filters to view specific log types
- Monitor real-time metrics and charts

## 📊 Sample Output

### **CLI Output**
```
[LOG] 2025-08-28 10:12:55,543 [http-nio-8080-exec-27] [ERROR] [MyJusticeApp:01.01.01] Database connection failed: Connection timeout after 30 seconds
[AI] {
  "log": "2025-08-28 10:12:55,543 [http-nio-8080-exec-27] [ERROR] [MyJusticeApp:01.01.01] Database connection failed: Connection timeout after 30 seconds",
  "anomaly": "Database Connection Error",
  "severity": "High",
  "suggested_fix": "Check database connectivity and restart connection pool"
}
```

### **Dashboard Features**
- **Live Log Stream**: Real-time log display with color coding
- **AI Analysis Panel**: Structured analysis results
- **Filtering**: View only errors, warnings, or all logs
- **Charts**: Severity distribution and anomaly type breakdown
- **Metrics**: Real-time statistics and runtime information

## 🔧 Configuration

### **Log Generation Settings**
- **Interval**: Control log generation frequency (default: 2 seconds)
- **Anomaly Types**: 8 different error patterns with variations
- **Probability Distribution**: Configurable INFO/WARN/ERROR ratios

### **AI Analysis Settings**
- **Model**: Mistral 7B (configurable to other Ollama models)
- **Temperature**: 0.1 for consistent output
- **Cache**: Analysis results cached for performance
- **Fallback**: Pattern-based analysis when AI fails

## 📈 Anomaly Types

### **High Severity**
- **Database Connection Error**: Connection timeouts, pool exhaustion
- **Workflow Halt**: Deadlocks, circular dependencies
- **Memory Allocation Error**: Out of memory, heap exhaustion

### **Critical Severity**
- **SLA Breach**: Processing delays, timeout violations
- **Security Policy Violation**: Unauthorized access, token issues

### **Medium Severity**
- **Rule Cache Overflow**: Cache limits, memory allocation
- **Integration Failure**: External service issues, API problems
- **File System Error**: Storage issues, permission problems

### **Low Severity**
- **Performance Warning**: Slow queries, high resource usage
- **Configuration Warning**: Deprecated settings, missing configs

## 🎯 Use Cases

### **Ministry of Justice - Saudi Arabia**
- **Pega System Monitoring**: Real-time analysis of justice application logs
- **Support Hours Reduction**: AI automatically identifies and suggests fixes
- **Proactive Issue Detection**: Early warning system for system anomalies
- **Compliance Monitoring**: Track SLA breaches and security violations

### **Enterprise Applications**
- **Any Application Logs**: Generic enough for any log format
- **IT Operations**: Reduce manual log analysis effort
- **DevOps**: Integrate with CI/CD pipelines
- **Security**: Monitor for security policy violations

## 🔌 Integration

### **ITSMs Ready**
- **ServiceNow**: JSON output format compatible
- **Jira**: Structured data for ticket creation
- **BMC Remedy**: API integration ready
- **Custom Systems**: JSON API endpoints

### **Monitoring Tools**
- **Prometheus**: Metrics export capability
- **Grafana**: Dashboard integration
- **ELK Stack**: Log forwarding support
- **Splunk**: Data ingestion ready

## 🚀 Demo for $100K Deal

### **Perfect for Stakeholder Meetings**
- **Live Demonstration**: Real-time log generation and analysis
- **Professional Interface**: Beautiful Streamlit dashboard
- **AI Capabilities**: Showcase Mistral 7B intelligence
- **Business Value**: Clear ROI through support hours reduction

### **Key Selling Points**
- **Self-Healing Foundation**: AI suggests automatic fixes
- **Scalable Architecture**: Handles enterprise-level log volumes
- **Integration Ready**: Connects to existing ITSM tools
- **Cost Effective**: Local AI processing, no API costs

## 📝 Project Structure

```
pega-log-analysis/
├── log_generator.py      # Synthetic log generation
├── analyzer.py           # AI analysis using Mistral
├── main.py              # CLI interface
├── dashboard.py         # Streamlit dashboard
├── requirements.txt     # Dependencies
└── README.md           # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for Ministry of Justice - Saudi Arabia**
