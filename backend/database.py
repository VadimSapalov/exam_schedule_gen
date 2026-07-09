from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

#Налаштування підключення
DATABASE_URL = "mysql+pymysql://root:@127.0.0.1:3306/exam_scheduler"

engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,  #Автоматично перевіряє життєздатність з'єднання перед запитом
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

#Dependency для динамічного впровадження сесії БД в АРІ маршрути
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()