from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # activities should include known keys
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    test_email = "test_student@example.com"

    # Ensure the test email is not present initially
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert test_email in activities[activity]["participants"]

    # Cannot sign up again (duplicate)
    resp_dup = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_un = client.post(f"/activities/{activity}/unregister?email={test_email}")
    assert resp_un.status_code == 200
    assert test_email not in activities[activity]["participants"]

    # Unregistering again should fail
    resp_un2 = client.post(f"/activities/{activity}/unregister?email={test_email}")
    assert resp_un2.status_code == 400
