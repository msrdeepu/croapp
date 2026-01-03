import ProfileWelcome from "src/components/dashboards/modern/ProfileWelcome";
import DashboardStats from "src/components/dashboards/modern/DashboardStats";

const Moderndash = () => {
    return (
        <>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                    <ProfileWelcome />
                </div>
                <div className="col-span-12">
                    <DashboardStats />
                </div>
            </div>

        </>
    );
};

export default Moderndash;