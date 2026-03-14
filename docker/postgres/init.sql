-- Survey Platform 초기 DB 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- timezone 설정
ALTER DATABASE survey_platform SET timezone TO 'Asia/Seoul';
