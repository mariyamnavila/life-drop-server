# Life Drop – Backend API
## Project Overview

This is the backend server for Life Drop, a blood donation web application.

It provides secure APIs to manage users, donation requests, blogs, funding records, and role-based access.

The backend ensures data integrity, authentication, and authorization for admins, volunteers, and users.

## Major Features

1. Authentication & Authorization

    * JWT-based authentication.

    * Firebase Admin used to verify users securely.

    * Role-based access control for Admin, Volunteer, and User.

2. Donation Request Management

    * Create, update, delete, and manage blood donation requests.

    * Donation request status can be updated by Admin, User, and Volunteer.

3. Content & Funding APIs

    * Blog APIs for adding, managing, and publishing content.

    * Funding-related endpoints to store donation data from Stripe payments.

## Technologies Used

* **Server**: Node.js, Express.js

* **Database**: MongoDB

* **Authentication**: JWT, Firebase Admin SDK

* **Others**: CORS, dotenv

## Run Locally

1. Clone the repository.

2. Run ``npm install``.

3. Create a ``.env`` file with MongoDB URI, JWT secret, and Firebase Admin credentials.

4. Start the server :
    * Development with auto-reload:
     ```nodemon index.js``` 
    * Production / without auto-reload: 
     ```node index.js```

## Repository

Backend Repo: https://github.com/mariyamnavila/life-drop-server
