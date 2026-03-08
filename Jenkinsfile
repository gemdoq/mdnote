pipeline {
    agent any

    environment {
        DB_PASSWORD = credentials('mdnote-db-password')
        JWT_SECRET = credentials('mdnote-jwt-secret')
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
