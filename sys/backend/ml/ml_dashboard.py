"""
ML Recommendation Performance Dashboard
"""
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from datetime import datetime, timedelta
from db.database import get_db
from sqlalchemy.orm import Session
import logging
from plotly.subplots import make_subplots
import plotly.graph_objects as go

router = APIRouter()
logger = logging.getLogger(__name__)

# Alert thresholds
ALERT_RULES = {
    "high_engagement": {
        "min_lift": 1.3,
        "min_category_boost": 1.4
    },
    "medium_engagement": {
        "min_lift": 1.1,
        "min_category_boost": 1.2
    },
    "low_engagement": {
        "min_lift": 0.9,
        "min_category_boost": 1.0
    },
    "all": {
        "max_price_sensitivity": 0.7
    }
}

# Sample data generator for demo (replace with real queries)
def get_performance_data(db: Session, days: int = 7) -> dict:
    """Get recent recommendation performance metrics"""
    # In production, query RecommendationMetrics table
    return {
        "dates": [datetime.now() - timedelta(days=i) for i in range(days)],
        "category_boost": [1.2 + 0.1*i for i in range(days)],
        "engagement_impact": [0.3 + 0.05*i for i in range(days)],
        "price_sensitivity": [0.5 - 0.02*i for i in range(days)],
        "score_lift": [1.1 + 0.03*i for i in range(days)]
    }

def get_segmentation_data(db: Session) -> dict:
    """Analyze performance by user segments"""
    segments = db.execute("""
        SELECT 
            CASE
                WHEN engagement_score > 0.7 THEN 'high_engagement'
                WHEN engagement_score < 0.3 THEN 'low_engagement'
                ELSE 'medium_engagement'
            END as segment,
            AVG(score_lift) as avg_lift,
            AVG(category_boost) as avg_category_boost,
            COUNT(*) as user_count
        FROM (
            SELECT 
                u.id,
                b.engagement_score,
                m.adjusted_score/m.base_score as score_lift,
                m.category_effect as category_boost
            FROM users u
            JOIN user_behavior_features b ON u.id = b.user_id
            JOIN recommendation_metrics m ON u.id = m.user_id
            WHERE m.timestamp >= NOW() - INTERVAL '7 days'
        ) t
        GROUP BY segment
    """).fetchall()
    
    return {
        'segments': [s[0] for s in segments],
        'lift': [s[1] for s in segments],
        'category_boost': [s[2] for s in segments],
        'user_count': [s[3] for s in segments]
    }

def create_performance_figure(data: dict) -> go.Figure:
    """Create Plotly dashboard figure"""
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            "Category Match Boost",
            "Engagement Impact",
            "Price Sensitivity Effect",
            "Overall Score Lift"
        )
    )
    
    # Category Boost
    fig.add_trace(
        go.Scatter(
            x=data["dates"],
            y=data["category_boost"],
            name="Category Boost",
            line=dict(color="#636EFA")
        ),
        row=1, col=1
    )
    
    # Engagement Impact
    fig.add_trace(
        go.Scatter(
            x=data["dates"],
            y=data["engagement_impact"],
            name="Engagement Impact",
            line=dict(color="#EF553B")
        ),
        row=1, col=2
    )
    
    # Price Sensitivity
    fig.add_trace(
        go.Scatter(
            x=data["dates"],
            y=data["price_sensitivity"],
            name="Price Sensitivity",
            line=dict(color="#00CC96")
        ),
        row=2, col=1
    )
    
    # Score Lift
    fig.add_trace(
        go.Scatter(
            x=data["dates"],
            y=data["score_lift"],
            name="Score Lift",
            line=dict(color="#AB63FA")
        ),
        row=2, col=2
    )
    
    fig.update_layout(
        height=800,
        title_text="Recommendation Performance Dashboard",
        showlegend=False
    )
    return fig

@router.get("/dashboard", response_class=HTMLResponse)
async def recommendation_dashboard(db: Session = Depends(get_db)):
    """Interactive performance dashboard"""
    data = get_performance_data(db)
    segmentation_data = get_segmentation_data(db)
    fig = create_performance_figure(data)
    
    return f"""
    <html>
        <head>
            <title>Recommendation Analytics</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        </head>
        <body>
            <h1>Recommendation Engine Performance</h1>
            <div id="plot">{fig.to_html(full_html=False)}</div>
            <h2>User Segmentation Analysis</h2>
            <table>
                <tr>
                    <th>Segment</th>
                    <th>Avg. Score Lift</th>
                    <th>Avg. Category Boost</th>
                    <th>User Count</th>
                </tr>
                {''.join(f'<tr><td>{segment}</td><td>{lift:.2f}</td><td>{category_boost:.2f}</td><td>{user_count}</td></tr>' for segment, lift, category_boost, user_count in zip(segmentation_data['segments'], segmentation_data['lift'], segmentation_data['category_boost'], segmentation_data['user_count']))}
            </table>
            <script>
                // Auto-refresh every 5 minutes
                setInterval(() => location.reload(), 300000);
            </script>
        </body>
    </html>
    """
