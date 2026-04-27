pipeline {
    agent any

    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    environment {
        DB_PASSWORD = credentials('mdnote-db-password')
        JWT_SECRET = credentials('mdnote-jwt-secret')
        GITHUB_CLIENT_ID = credentials('mdnote-github-client-id')
        GITHUB_CLIENT_SECRET = credentials('mdnote-github-client-secret')
        GITHUB_REDIRECT_URI = 'https://mdnote.matchhub.co.kr/oauth/callback'
        DISCORD_WEBHOOK_BUILD_SUCCESS = credentials('discord-webhook-build-success')
        DISCORD_WEBHOOK_BUILD_FAILURE = credentials('discord-webhook-build-failure')
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'chmod +x gradlew'
                    sh './gradlew clean build -x test'
                }
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                sh 'docker compose down || true'
                sh 'docker rm -f mdnote-backend mdnote-frontend || true'
                sh 'docker compose up -d --build'
            }
        }

        stage('Health Verification') {
            steps {
                script {
                    sh '''
                        echo "백엔드 healthy 대기 (최대 4분)..."
                        for i in $(seq 1 24); do
                            status=$(docker inspect mdnote-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "missing")
                            echo "  [$i/24] mdnote-backend: $status"
                            if [ "$status" = "healthy" ]; then
                                echo "✅ healthy 도달"
                                break
                            fi
                            if [ "$i" -eq 24 ]; then
                                echo "❌ 타임아웃: healthy 미도달"
                                docker logs mdnote-backend --tail 50
                                exit 1
                            fi
                            sleep 10
                        done
                    '''
                    sh '''
                        echo "외부 HTTPS 응답 검증..."
                        code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 https://mdnote.matchhub.co.kr/ || echo "000")
                        if [ "$code" != "200" ]; then
                            echo "❌ HTTPS 비정상: HTTP $code"
                            exit 1
                        fi
                        echo "✅ https://mdnote.matchhub.co.kr 정상 (HTTP $code)"
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps { sh 'docker image prune -f' }
        }
    }

    post {
        success {
            sh '''
                curl -sS -H "Content-Type: application/json" \
                     -d '{
                       "embeds": [{
                         "title": "✅ mdnote 배포 성공",
                         "description": "빌드 #'"${BUILD_NUMBER}"' 배포 완료\\nhttps://mdnote.matchhub.co.kr",
                         "color": 3066993
                       }]
                     }' \
                     "${DISCORD_WEBHOOK_BUILD_SUCCESS}" >/dev/null 2>&1 || true
            '''
        }
        failure {
            sh '''
                curl -sS -H "Content-Type: application/json" \
                     -d '{
                       "embeds": [{
                         "title": "❌ mdnote 배포 실패",
                         "description": "빌드 #'"${BUILD_NUMBER}"' 실패\\n[로그 보기]('"${BUILD_URL}"'console)",
                         "color": 15158332
                       }]
                     }' \
                     "${DISCORD_WEBHOOK_BUILD_FAILURE}" >/dev/null 2>&1 || true
            '''
        }
    }
}
