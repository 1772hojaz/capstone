from .celery_app import celery_app

@celery_app.task(name="health.ping")
def ping() -> str:
    return "pong"

@celery_app.task(name="analytics.run_daily_jobs")
def analytics_run_daily_jobs() -> str:
    from analytics.etl_pipeline import run_daily_analytics_jobs_once
    import asyncio
    asyncio.run(run_daily_analytics_jobs_once())
    return "ok"

