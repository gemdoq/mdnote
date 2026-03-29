pipeline {
    agent any

    environment {
        DB_PASSWORD = credentials('mdnote-db-password')
        JWT_SECRET = credentials('mdnote-jwt-secret')
        GITHUB_CLIENT_ID = credentials('mdnote-github-client-id')
        GITHUB_CLIENT_SECRET = credentials('mdnote-github-client-secret')
        GITHUB_REDIRECT_URI = 'http://everforest.iptime.org:8089/oauth/callback'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
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

        stage('Cleanup') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        failure {
            echo 'mdnote 배포 실패'
        }
        success {
            echo 'mdnote 배포 성공'
        }
    }
}
